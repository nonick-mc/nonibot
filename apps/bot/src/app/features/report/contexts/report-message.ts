import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  RadioGroupBuilder,
  RadioGroupOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ContextMenu, execute } from 'sunar';
import { db } from '@/src/lib/db';
import { errorMessage } from '@/src/lib/format';

export const context = new ContextMenu({
  name: 'メッセージを通報',
  type: ApplicationCommandType.Message,
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
});

execute(context, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const targetMessage = interaction.targetMessage;
  const targetMember = interaction.targetMessage.member;
  const targetUser = interaction.targetMessage.author;

  const setting = await db.query.reportSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, interaction.guildId),
  });

  if (!setting?.enabled) {
    return interaction.reply({
      content: errorMessage('このサーバーでは通報機能を使用することはできません。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  if (targetUser.id === interaction.user.id) {
    return interaction.reply({
      content: errorMessage('自分自身を通報することはできません。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  if (
    targetUser.system || // システムメッセージ
    targetUser.id === interaction.client.user.id || // Bot自身のメッセージ
    targetMember?.roles.cache.hasAny(...setting.ignoreRoles) || // 対象外ロールを所持している
    targetMember?.permissions.has(PermissionFlagsBits.Administrator) || // 管理者権限を所持している
    (!setting.includeModerator &&
      targetMember?.permissions.has(PermissionFlagsBits.ModerateMembers)) // モデレーター
  ) {
    return interaction.reply({
      content: errorMessage('このユーザーを通報することはできません。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`report:send-message-report_${targetMessage.id}`)
    .setTitle('メッセージを通報');

  if (setting.messageCategories.length) {
    modal.addLabelComponents(
      new LabelBuilder().setLabel('通報理由').setRadioGroupComponent(
        new RadioGroupBuilder()
          .setCustomId('reason')
          .setOptions(
            setting.messageCategories.map((category) =>
              new RadioGroupOptionBuilder().setLabel(category.label).setValue(category.label),
            ),
          )
          .setRequired(true),
      ),
      new LabelBuilder()
        .setLabel('コメント')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('comment')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setPlaceholder('補足があれば入力してください (任意)')
            .setRequired(false),
        ),
    );
  } else {
    modal.addLabelComponents(
      new LabelBuilder()
        .setLabel('通報理由')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('reason')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setRequired(true),
        ),
    );
  }

  await interaction.showModal(modal);
});
