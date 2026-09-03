import { oneLineTrim } from 'common-tags';
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
  subtext,
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
  const isCancel = auditLogEntry.action === AuditLogEvent.MemberBanRemove;
  if (auditLogEntry.action !== AuditLogEvent.MemberBanAdd && !isCancel) return;

  const { executor, target, reason } = auditLogEntry as GuildAuditLogsEntry<
    AuditLogEvent.MemberBanAdd | AuditLogEvent.MemberBanRemove
  >;
  if (!executor || !target) return;

  const resolvedTarget = target.partial ? await target.fetch() : target;
  const resolvedExecutor = executor.partial ? await executor.fetch() : executor;

  const setting = await db.query.banLogSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guild.id),
  });

  const components = isCancel
    ? [
        new ContainerBuilder()
          .setAccentColor(Colors.Blue)
          .addSectionComponents(
            new SectionBuilder()
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(resolvedTarget.displayAvatarURL()),
              )
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  heading(`${getAppEmoji(Primary.circleOff)} BAN解除`, HeadingLevel.Three),
                ),
                new TextDisplayBuilder().setContent(
                  unorderedList([
                    `${getAppEmoji(Default.userRound)} 対象者: ${resolvedExecutor} ${inlineCode(resolvedExecutor.username)}`,
                    `${getAppEmoji(Primary.userRoundPen)} 実行者: ${resolvedTarget} ${inlineCode(resolvedTarget.username)}`,
                  ]),
                ),
              ),
          ),
      ]
    : [
        new ContainerBuilder()
          .setAccentColor(Colors.Red)
          .addSectionComponents(
            new SectionBuilder()
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(resolvedTarget.displayAvatarURL()),
              )
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  heading(`${getAppEmoji(Destructive.ban)} BAN`, HeadingLevel.Three),
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
