import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { execute, protect, Slash } from 'sunar';
import { appPerms } from '@/src/app/shared/protectors/perms';
import { errorMessage } from '@/src/lib/format';

export const slash = new Slash({
  name: 'firstmessage',
  description: 'チャンネルの最初に投稿されたメッセージのURLボタンを送信',
  options: [
    {
      name: 'content',
      description: 'メッセージ',
      type: ApplicationCommandOptionType.String,
      maxLength: 200,
    },
    {
      name: 'label',
      description: 'ボタンのテキスト',
      type: ApplicationCommandOptionType.String,
      maxLength: 80,
    },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageMessages,
  ],
});

protect(slash, [appPerms(PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory)]);

execute(slash, async (interaction) => {
  if (!interaction.inGuild()) return;
  if (!interaction.channel)
    return interaction.reply({
      content: errorMessage('メッセージを取得できませんでした'),
      flags: [MessageFlags.Ephemeral],
    });

  const messages = await interaction.channel.messages
    .fetch({ after: '0', limit: 1 })
    .catch(() => null);
  const message = messages?.first();

  if (!message)
    return interaction.reply({
      content: errorMessage('メッセージを取得できませんでした'),
      flags: [MessageFlags.Ephemeral],
    });

  interaction.reply({
    content: interaction.options.getString('content') ?? undefined,
    components: [
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setLabel(interaction.options.getString('label') ?? '最上部へ移動')
          .setURL(message.url)
          .setStyle(ButtonStyle.Link),
      ),
    ],
  });
});
