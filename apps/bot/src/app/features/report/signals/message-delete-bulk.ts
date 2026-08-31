import {
  AuditLogEvent,
  ContainerBuilder,
  Events,
  PermissionFlagsBits,
  TextDisplayBuilder,
  userMention,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { Destructive, getAppEmoji } from '@/src/constants/emoji';
import {
  deleteReport,
  findReportByThreadId,
  findReportsByMessage,
  sendReportLog,
} from '../notify-report-thread';

export const signal = new Signal(Events.MessageBulkDelete);

execute(signal, async (messages, channel) => {
  const guild = channel.guild;
  if (!guild) return;

  let executorMention: string | null = null;
  let executorResolved = false;

  for (const message of messages.values()) {
    const cardReport = await findReportByThreadId(message.id);
    if (cardReport) await deleteReport(cardReport.id);

    const reports = await findReportsByMessage(guild.id, message.channelId, message.id);
    if (!reports.length) continue;

    if (!executorResolved) {
      executorResolved = true;

      if (guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const logs = await guild
          .fetchAuditLogs({ type: AuditLogEvent.MessageBulkDelete, limit: 3 })
          .catch(() => null);

        const entry = logs?.entries.find((e) => Date.now() - e.createdTimestamp < 5_000);
        if (entry?.executor) executorMention = userMention(entry.executor.id);
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${getAppEmoji(Destructive.trash2)} ${executorMention ?? '不明なユーザー'}がメッセージを削除しました`,
      ),
    );

    await sendReportLog(guild, reports, [container]);
  }
});
