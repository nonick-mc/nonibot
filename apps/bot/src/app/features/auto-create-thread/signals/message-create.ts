import { renderPlaceholders } from '@repo/placeholders';
import {
  autoCreateThreadActions,
  collectInteractiveComponents,
  isAllowedComponent,
} from '@repo/shared';
import {
  type APIMessageTopLevelComponent,
  ChannelType,
  Events,
  MessageFlags,
  type ThreadChannel,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import {
  getAutoCreateThreadMessagePlaceholderParams,
  getAutoCreateThreadNamePlaceholderParams,
} from '@/src/lib/placeholder';

export const signal = new Signal(Events.MessageCreate);

execute(signal, async (message) => {
  if (!message.inGuild()) return;
  if (
    message.channel.type !== ChannelType.GuildText &&
    message.channel.type !== ChannelType.GuildAnnouncement
  )
    return;
  if (message.system) return;
  if (message.author.id === message.client.user.id) return;

  const rule = await db.query.autoCreateThreadRule.findFirst({
    where: (rule, { eq, and }) =>
      and(eq(rule.guildId, message.guild.id), eq(rule.channelId, message.channelId)),
  });
  if (!rule?.enabled) return;
  if (rule.ignoreBot && (message.author.bot || message.webhookId)) return;
  if (rule.ignoreRoles.length > 0 && message.member?.roles.cache.hasAny(...rule.ignoreRoles))
    return;

  const threadName =
    renderPlaceholders(rule.threadName, getAutoCreateThreadNamePlaceholderParams(message))?.trim() ||
    `${message.author.displayName}のスレッド`;

  const thread = await message
    .startThread({
      name: threadName.length > 100 ? `${threadName.slice(0, 97)}...` : threadName,
      autoArchiveDuration: rule.autoArchiveDuration,
      reason: '自動スレッド作成',
    })
    .catch((e) => {
      console.error(e);
      return null;
    });

  // アーカイブ済みのスレッドに送信すると再オープンされるため、状態を変更する前に送信する
  if (thread && rule.messageEnabled && rule.messageComponents.length) {
    await sendMessage(
      thread,
      rule.messageComponents,
      getAutoCreateThreadMessagePlaceholderParams(message),
    );
  }

  if (thread && rule.initialThreadState !== 'open') {
    await thread
      .edit({
        archived:
          rule.initialThreadState === 'archived' || rule.initialThreadState === 'archived_locked',
        locked:
          rule.initialThreadState === 'locked' || rule.initialThreadState === 'archived_locked',
      })
      .catch((e) => console.error(e));
  }
});

async function sendMessage(
  thread: ThreadChannel,
  components: APIMessageTopLevelComponent[],
  params: Record<string, string>,
) {
  // 任意のcustom_idによるインタラクションの実行を防ぐため、許可されていないコンポーネントを含む場合は送信しない
  if (
    collectInteractiveComponents(components).some(
      (component) => !isAllowedComponent(autoCreateThreadActions, component),
    )
  ) {
    console.error(
      `[auto-create-thread] 許可されていないcustom_idが含まれています: ${thread.guildId}`,
    );
    return;
  }

  await thread
    .send({
      components: renderPlaceholders(components, params),
      flags: MessageFlags.IsComponentsV2,
    })
    .catch((e) => console.error(e));
}
