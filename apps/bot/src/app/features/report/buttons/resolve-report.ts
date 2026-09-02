import {
  ChannelType,
  Colors,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { Button, execute } from 'sunar';
import { getAppEmoji, Success } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { deleteReport, findReportByThreadId } from '../notify-report-thread';

export const button = new Button({ id: 'report:resolve' });

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const thread = interaction.channel?.isThread() ? interaction.channel : interaction.message.thread;
  if (!thread) return;

  const report = await findReportByThreadId(thread.id);
  if (report) await deleteReport(report.id);

  let coloredFirstContainer = false;
  const components = interaction.message.components.map((component) => {
    if (component.type !== ComponentType.Container || coloredFirstContainer) {
      return component.toJSON();
    }
    coloredFirstContainer = true;
    const container = new ContainerBuilder(component.toJSON()).setAccentColor(Colors.Green);
    return container.toJSON();
  });

  components.splice(components.length - 1, 1);

  await interaction.update({ components });

  await thread.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Green)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${getAppEmoji(Success.circleCheck)} ${interaction.user}が報告を対応済みとしてマークしました。`,
          ),
        ),
    ],
    flags: [MessageFlags.IsComponentsV2],
    allowedMentions: { parse: [] },
  });

  let appliedTags: string[] | undefined;
  if (thread.parent?.type === ChannelType.GuildForum) {
    const setting = await db.query.reportSetting.findFirst({
      where: (s, { eq }) => eq(s.guildId, interaction.guildId),
    });
    if (setting?.resolvedForumTag && !thread.appliedTags.includes(setting.resolvedForumTag)) {
      appliedTags = [...thread.appliedTags, setting.resolvedForumTag];
    }
  }

  await thread.edit({ archived: true, locked: true, appliedTags });
});
