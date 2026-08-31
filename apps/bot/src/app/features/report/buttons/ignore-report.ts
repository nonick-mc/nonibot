import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Button, execute } from 'sunar';

export const button = new Button({ id: 'report:ignore' });

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const modal = new ModalBuilder()
    .setCustomId('report:send-ignore-reason')
    .setTitle('対応なしにする理由')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('理由')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('reason')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(true),
        ),
    );

  await interaction.showModal(modal);
});
