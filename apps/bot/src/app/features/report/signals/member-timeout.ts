import {
  AuditLogEvent,
  ContainerBuilder,
  Events,
  type GuildAuditLogsEntry,
  TextDisplayBuilder,
  TimestampStyles,
  time,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { Destructive, getAppEmoji, Primary } from '@/src/constants/emoji';
import { findReportsByUser, sendReportLog } from '../notify-report-thread';

export const signal = new Signal(Events.GuildAuditLogEntryCreate);

execute(signal, async (auditLogEntry, guild) => {
  if (auditLogEntry.action !== AuditLogEvent.MemberUpdate) return;

  const { executor, target, changes } =
    auditLogEntry as GuildAuditLogsEntry<AuditLogEvent.MemberUpdate>;

  const change = changes.find((c) => c.key === 'communication_disabled_until');
  if (!change) return;

  if (!executor || !target) return;

  const reports = await findReportsByUser(guild.id, target.id);
  if (!reports.length) return;

  const newValue = change.new as string | undefined;
  const isCancel = !newValue || Date.parse(newValue) <= Date.now();

  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      isCancel
        ? `${getAppEmoji(Primary.clock)} ${executor}が${target}のタイムアウトを解除しました`
        : `${getAppEmoji(Destructive.clock)} ${executor}が${target}を${time(new Date(newValue), TimestampStyles.LongDateShortTime)}までタイムアウトしました`,
    ),
  );

  await sendReportLog(guild, reports, [container]);
});
