import {
  ContainerBuilder,
  Events,
  type Guild,
  HeadingLevel,
  heading,
  type Message,
  MessageFlags,
  PermissionFlagsBits,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  subtext,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { markAutoModDeleted, unmarkAutoModDeleted } from '@/src/app/shared/automod-deleted';
import { addMessageContent } from '@/src/app/shared/message-content';
import { Default, Destructive, getAppEmoji } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { baseField, channelField, timeField, userField } from '@/src/lib/format';
import { sendViaWebhook } from '@/src/lib/webhook';

export const signal = new Signal(Events.MessageCreate);

const inviteRegex = /(?:discord(?:app)?\.com\/invite|discord\.gg)\/([a-z0-9-]+)/gi;
const tokenRegexes = [
  /mfa\.[a-z0-9_-]{20,}/i,
  /[a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27}/i,
];

// 招待コードのキャッシュ。ヒットした場合のみ信頼し、ミスの場合は再取得して確認する
const InviteCacheTtl = 30_000;
const InviteRefetchMinAge = 5_000;
const inviteCache = new Map<string, { codes: Set<string>; fetchedAt: number }>();

// 期限切れのキャッシュを定期的に破棄する
setInterval(() => {
  for (const [guildId, { fetchedAt }] of inviteCache) {
    if (Date.now() - fetchedAt > InviteCacheTtl) inviteCache.delete(guildId);
  }
}, InviteCacheTtl).unref();

async function fetchInviteCodes(guild: Guild) {
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return null;
  const entry = { codes: new Set(invites.keys()), fetchedAt: Date.now() };
  inviteCache.set(guild.id, entry);
  return entry;
}

async function isOwnInviteCode(guild: Guild, code: string) {
  let entry = inviteCache.get(guild.id);
  if (!entry || Date.now() - entry.fetchedAt > InviteCacheTtl)
    entry = (await fetchInviteCodes(guild)) ?? undefined;
  if (!entry) return null;
  if (entry.codes.has(code)) return true;

  // 作成直後の招待を誤ってブロックしないよう、キャッシュが古ければ再取得して確認する
  if (Date.now() - entry.fetchedAt >= InviteRefetchMinAge)
    entry = (await fetchInviteCodes(guild)) ?? entry;
  return entry.codes.has(code);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

execute(signal, async (message) => {
  if (
    !message.inGuild() ||
    !message.member ||
    message.author.bot ||
    message.system ||
    (!message.content && message.messageSnapshots.size === 0) ||
    message.member.permissions.has(PermissionFlagsBits.ManageGuild)
  )
    return;

  const setting = await db.query.autoModSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, message.guildId),
  });
  if (
    !setting?.enabled ||
    setting.ignoreChannels.includes(message.channelId) ||
    (message.channel.isThread() &&
      message.channel.parentId &&
      setting.ignoreChannels.includes(message.channel.parentId)) ||
    message.member.roles.cache.hasAny(...setting.ignoreRoles)
  )
    return;

  const rule = await detectRule(message, setting);
  if (!rule || !message.deletable) return;

  markAutoModDeleted(message.id);
  const deleted = await message.delete().then(
    () => true,
    () => false,
  );
  if (!deleted) unmarkAutoModDeleted(message.id);
  if (!deleted || !setting.enableLog || !setting.logChannel) return;

  const container = new ContainerBuilder()
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL()))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            heading(
              `${getAppEmoji(Destructive.shieldAlert)} メッセージブロック`,
              HeadingLevel.Three,
            ),
          ),
          new TextDisplayBuilder().setContent(
            unorderedList([
              userField(Default.userRound, '送信者', message.author),
              channelField(Default.hash, 'チャンネル', message.channel),
              timeField(Default.calendarClock, '送信時刻', message.createdAt),
              baseField(Default.shieldAlert, 'ルール', rule),
            ]),
          ),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(subtext('メッセージの内容')));

  for (const snapshot of message.messageSnapshots.values()) {
    if (snapshot.content)
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(snapshot.content));
  }
  const files = await addMessageContent(container, message);

  await sendViaWebhook(message.guild, setting.logChannel, {
    components: [container],
    files,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
});

// 最初に一致したルール名を返す
async function detectRule(
  message: Message<true>,
  setting: {
    enableInviteUrlFilter: boolean;
    enableTokenFilter: boolean;
    enableDomainFilter: boolean;
    domainList: string[];
  },
) {
  // 転送されたメッセージの本文も検査対象にする
  const content = [message.content, ...message.messageSnapshots.map((s) => s.content)].join('\n');

  if (setting.enableInviteUrlFilter) {
    const codes = new Set([...content.matchAll(inviteRegex)].map((m) => m[1] as string));
    // 招待リンクの判定には「サーバー管理」権限が必要。取得できない場合は判定できないため通す
    // バニティURLのコードは招待リンク一覧に含まれず、Guildオブジェクトから取得できる
    const vanity = message.guild.vanityURLCode?.toLowerCase();
    for (const code of codes) {
      if (code.toLowerCase() === vanity) continue;
      if ((await isOwnInviteCode(message.guild, code)) === false) return 'サーバー招待リンク';
    }
  }

  if (setting.enableTokenFilter && tokenRegexes.some((r) => r.test(content)))
    return 'Discordアカウントのトークン';

  if (
    setting.enableDomainFilter &&
    setting.domainList.some((domain) =>
      new RegExp(`(?:^|[^a-z0-9-])${escapeRegExp(domain)}(?:$|[^a-z0-9-])`, 'i').test(content),
    )
  )
    return 'ドメイン';

  return null;
}
