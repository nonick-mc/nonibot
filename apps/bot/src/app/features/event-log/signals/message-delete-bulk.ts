import {
  AuditLogEvent,
  ContainerBuilder,
  Events,
  HeadingLevel,
  heading,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  subtext,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { addMessageContent } from '@/src/app/shared/message-content';
import { Default, Destructive, getAppEmoji, Primary } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { channelField, timeField, userField } from '@/src/lib/format';
import { sendEventLog } from '../send-log';

export const signal = new Signal(Events.MessageBulkDelete);

execute(signal, async (messages, channel) => {
  const guild = channel.guild;
  if (!guild) return;

  const setting = await db.query.msgDeleteLogSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guild.id),
  });

  const logs = await guild
    .fetchAuditLogs({ type: AuditLogEvent.MessageBulkDelete, limit: 1 })
    .catch(() => null);
  const entry = logs?.entries.first();
  const isTargetMatch = entry?.targetId === channel.id;
  const executor = isTargetMatch ? entry.executor : null;
  const executorId = isTargetMatch ? entry.executorId : null;

  const resolvedExecutor = executor?.partial ? await executor.fetch() : executor;

  for (const message of messages.values()) {
    if (message.partial || message.flags.has(MessageFlags.Ephemeral)) continue;

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL()))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              heading(`${getAppEmoji(Destructive.trash2)} メッセージ削除`, HeadingLevel.Three),
            ),
            new TextDisplayBuilder().setContent(
              unorderedList([
                userField(Default.userRound, '送信者', message.author),
                channelField(Default.hash, 'チャンネル', channel),
                timeField(Default.calendarClock, '送信時刻', message.createdAt),
                ...(resolvedExecutor
                  ? [userField(Primary.userRoundPen, '削除者', resolvedExecutor)]
                  : []),
              ]),
            ),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(subtext('メッセージの内容')));

    const files = await addMessageContent(container, message);

    await sendEventLog(guild, setting, { components: [container], files }, executorId);
  }
});
