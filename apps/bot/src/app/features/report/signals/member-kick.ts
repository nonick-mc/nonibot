import {
  AuditLogEvent,
  ContainerBuilder,
  Events,
  type GuildAuditLogsEntry,
  TextDisplayBuilder,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { Destructive, getAppEmoji } from '@/src/constants/emoji';
import { findReportsByUser, sendReportLog } from '../notify-report-thread';

export const signal = new Signal(Events.GuildAuditLogEntryCreate);

execute(signal, async (auditLogEntry, guild) => {
  if (auditLogEntry.action !== AuditLogEvent.MemberKick) return;

  const { executor, target } = auditLogEntry as GuildAuditLogsEntry<AuditLogEvent.MemberKick>;
  if (!executor || !target) return;

  const reports = await findReportsByUser(guild.id, target.id);
  if (!reports.length) return;

  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${getAppEmoji(Destructive.logOut)} ${executor}が${target}をキックしました`,
    ),
  );

  await sendReportLog(guild, reports, [container]);
});
