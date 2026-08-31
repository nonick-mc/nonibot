import {
  Colors,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  subtext,
  TextDisplayBuilder,
} from 'discord.js';
import { execute, Modal } from 'sunar';
import { Destructive, getAppEmoji } from '@/src/constants/emoji';
import { deleteReport, findReportByThreadId } from '../notify-report-thread';

export const modal = new Modal({ id: 'report:send-ignore-reason' });

execute(modal, async (interaction) => {
  if (!interaction.inCachedGuild() || !interaction.isFromMessage()) return;

  const thread = interaction.channel?.isThread() ? interaction.channel : interaction.message.thread;
  if (!thread) return;

  const report = await findReportByThreadId(thread.id);
  if (report) await deleteReport(report.id);

  const reason = interaction.fields.getTextInputValue('reason');

  let coloredFirstContainer = false;
  const components = interaction.message.components.map((component) => {
    if (component.type !== ComponentType.Container || coloredFirstContainer) {
      return component.toJSON();
    }
    coloredFirstContainer = true;
    const container = new ContainerBuilder(component.toJSON()).setAccentColor(Colors.Red);
    return container.toJSON();
  });

  components.splice(components.length - 1, 1);

  await interaction.update({ components });

  await thread.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Red)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${getAppEmoji(Destructive.circleAlert)} ${interaction.user}が対応なしとしてマークしました。`,
          ),
          new TextDisplayBuilder().setContent(subtext(`理由: ${reason}`)),
        ),
    ],
    flags: [MessageFlags.IsComponentsV2],
    allowedMentions: { parse: [] },
  });

  await thread.edit({ archived: true, locked: true });
});
