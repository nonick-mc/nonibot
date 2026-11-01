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

export const signal = new Signal(Events.MessageDelete);

execute(signal, async (message) => {
  const guild = message.guild;
  if (!guild) return;

  const cardReport = await findReportByThreadId(message.id);
  if (cardReport) await deleteReport(cardReport.id);

  const reports = await findReportsByMessage(guild.id, message.channelId, message.id);
  const [firstReport] = reports;
  if (!firstReport) return;

  let executorId = firstReport.targetUserId;

  if (guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
    const logs = await guild
      .fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 5 })
      .catch(() => null);

    const entry = logs?.entries.find(
      (e) =>
        e.target?.id === firstReport.targetUserId &&
        e.extra?.channel?.id === message.channelId &&
        Date.now() - e.createdTimestamp < 5_000,
    );

    if (entry?.executor) executorId = entry.executor.id;
  }

  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${getAppEmoji(Destructive.trash2)} ${userMention(executorId)}がメッセージを削除しました`,
    ),
  );

  await sendReportLog(guild, reports, [container]);
});
