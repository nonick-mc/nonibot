import {
  AuditLogEvent,
  ContainerBuilder,
  Events,
  type GuildAuditLogsEntry,
  TextDisplayBuilder,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { Destructive, getAppEmoji, Primary } from '@/src/constants/emoji';
import { findReportsByUser, sendReportLog } from '../notify-report-thread';

export const signal = new Signal(Events.GuildAuditLogEntryCreate);

execute(signal, async (auditLogEntry, guild) => {
  const isCancel = auditLogEntry.action === AuditLogEvent.MemberBanRemove;
  if (auditLogEntry.action !== AuditLogEvent.MemberBanAdd && !isCancel) return;

  const { executor, target } = auditLogEntry as GuildAuditLogsEntry<
    AuditLogEvent.MemberBanAdd | AuditLogEvent.MemberBanRemove
  >;
  if (!executor || !target) return;

  const reports = await findReportsByUser(guild.id, target.id);
  if (!reports.length) return;

  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      isCancel
        ? `${getAppEmoji(Primary.circleOff)} ${executor}が${target}のBANを解除しました`
        : `${getAppEmoji(Destructive.ban)} ${executor}が${target}をBanしました`,
    ),
  );

  await sendReportLog(guild, reports, [container]);
});
