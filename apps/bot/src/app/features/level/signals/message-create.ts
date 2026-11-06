import { memberLevel } from '@repo/database';
import { renderPlaceholders } from '@repo/placeholders';
import { Events, MessageFlags } from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { getLevelNotifyMessagePlaceholderParams } from '@/src/lib/placeholder';
import { addXP, getExp, isValidContent } from '../xp';

export const signal = new Signal(Events.MessageCreate);

/** 同一ユーザーが経験値を獲得できる間隔 */
const CooldownMs = 60_000;

execute(signal, async (message) => {
  if (!message.inGuild() || message.author.bot || message.system) return;
  const { guild, channel, member } = message;
  if (!member || channel.isVoiceBased()) return;

  const setting = await db.query.levelSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guild.id),
  });
  if (!setting?.enabled) return;

  // チャンネル・(スレッドの場合)親チャンネル・カテゴリのいずれかが除外対象なら対象外
  const channelIds = [
    channel.id,
    channel.parentId,
    channel.isThread() ? channel.parent?.parentId : null,
  ];
  if (channelIds.some((id) => id && setting.ignoreChannels.includes(id))) return;
  if (member.roles.cache.hasAny(...setting.ignoreRoles)) return;
  if (!isValidContent(message.content)) return;

  const current = await db.query.memberLevel.findFirst({
    where: (t, { and, eq }) => and(eq(t.guildId, guild.id), eq(t.userId, member.id)),
  });
  const now = new Date();
  if (current && now.getTime() - current.lastGainedAt.getTime() < CooldownMs) return;

  const before = current?.lv ?? 0;
  const { lv, xp } = addXP({ lv: before, xp: current?.xp ?? 0 }, getExp());

  await db
    .insert(memberLevel)
    .values({ guildId: guild.id, userId: member.id, lv, xp, lastGainedAt: now })
    .onConflictDoUpdate({
      target: [memberLevel.guildId, memberLevel.userId],
      set: { lv, xp, lastGainedAt: now },
    });

  if (lv === before || setting.notifyMode === 'none') return;

  const target =
    setting.notifyMode === 'fixedChannel' && setting.notifyChannel
      ? await guild.channels.fetch(setting.notifyChannel).catch(() => null)
      : channel;
  if (!target?.isSendable()) return;

  // 送信権限がない場合などは、経験値は保存済みなので通知だけ諦める
  await target
    .send({
      components: renderPlaceholders(
        setting.notifyMessageComponents,
        getLevelNotifyMessagePlaceholderParams(member, lv),
      ),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { users: [member.id] },
    })
    .catch(() => null);
});
