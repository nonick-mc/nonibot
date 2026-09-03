import {
  AuditLogEvent,
  Colors,
  ContainerBuilder,
  Events,
  type GuildAuditLogsEntry,
  HeadingLevel,
  heading,
  inlineCode,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { Default, Destructive, getAppEmoji, Primary } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { sendEventLog } from '../send-log';

export const signal = new Signal(Events.GuildAuditLogEntryCreate);

execute(signal, async (auditLogEntry, guild) => {
  if (auditLogEntry.action !== AuditLogEvent.MemberKick) return;

  const { executor, target, reason } =
    auditLogEntry as GuildAuditLogsEntry<AuditLogEvent.MemberKick>;
  if (!executor || !target) return;

  const resolvedTarget = target.partial ? await target.fetch() : target;
  const resolvedExecutor = executor.partial ? await executor.fetch() : executor;

  const setting = await db.query.kickLogSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guild.id),
  });

  const components = [
    new ContainerBuilder()
      .setAccentColor(Colors.Red)
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(resolvedTarget.displayAvatarURL()))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              heading(`${getAppEmoji(Destructive.logOut)} キック`, HeadingLevel.Three),
            ),
            new TextDisplayBuilder().setContent(
              unorderedList([
                `${getAppEmoji(Default.userRound)} 対象者: ${resolvedExecutor} ${inlineCode(resolvedExecutor.username)}`,
                `${getAppEmoji(Primary.userRoundPen)} 実行者: ${resolvedTarget} ${inlineCode(resolvedTarget.username)}`,
                `${getAppEmoji(Primary.messageSquareText)} 理由: ${reason ?? inlineCode('理由が入力されていません')}`,
              ]),
            ),
          ),
      ),
  ];
  await sendEventLog(guild, setting, components, auditLogEntry.executorId);
});
