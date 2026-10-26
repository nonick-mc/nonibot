import { Links } from '@repo/shared/constants';
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  HeadingLevel,
  heading,
  InteractionContextType,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import { execute, Slash } from 'sunar';

export const slash = new Slash({
  name: 'help',
  description: 'このBotについて',
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
});

execute(slash, async (interaction) => {
  return interaction.reply({
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            heading(interaction.client.user.username, HeadingLevel.Three),
          ),
          new TextDisplayBuilder().setContent(
            'あなたのDiscordサーバーをもっと便利にする、次世代のDiscordBotです。',
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(
              'https://cdn.nonick.net/nonibot/twitter-banner.png',
            ),
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('サポートサーバー')
              .setStyle(ButtonStyle.Link)
              .setURL(Links.SupportServer),
            new ButtonBuilder()
              .setLabel('ドキュメント')
              .setStyle(ButtonStyle.Link)
              .setURL(Links.Docs),
            new ButtonBuilder()
              .setLabel('ダッシュボード')
              .setStyle(ButtonStyle.Link)
              .setURL(Links.Dashboard),
          ),
        ),
    ],
    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
  });
});
