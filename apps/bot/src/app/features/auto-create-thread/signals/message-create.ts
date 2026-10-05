import { renderPlaceholders } from '@repo/placeholders';
import { Events, MessageFlags } from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { getAutoThreadPlaceholderParams } from '@/src/lib/placeholder';

export const signal = new Signal(Events.MessageCreate);

execute(signal, async (message) => {
  if (!message.inGuild()) return;
  if (message.author.id === message.client.user.id) return;

  const rule = await db.query.autoCreateThreadRule.findFirst({
    where: (rule, { eq, and }) =>
      and(eq(rule.guildId, message.guild.id), eq(rule.channelId, message.channelId)),
  });
  if (!rule?.enabled) return;
  if (rule.ignoreBot && (message.author.bot || message.webhookId)) return;
  if (rule.ignoreRoles.length > 0 && message.member?.roles.cache.hasAny(...rule.ignoreRoles))
    return;

  const placeholderParams = getAutoThreadPlaceholderParams(message);
  const threadName = renderPlaceholders(rule.threadName, placeholderParams);

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
    await thread
      .send({
        components: renderPlaceholders(rule.messageComponents, placeholderParams),
        flags: MessageFlags.IsComponentsV2,
      })
      .catch((e) => console.error(e));
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
