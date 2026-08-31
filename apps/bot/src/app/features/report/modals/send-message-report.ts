import { report } from '@repo/database';
import { SnowflakeRegex } from '@repo/shared';
import { oneLineTrim } from 'common-tags';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  bold,
  ChannelType,
  ContainerBuilder,
  type ForumThreadChannel,
  HeadingLevel,
  heading,
  hyperlink,
  type InteractionEditReplyOptions,
  inlineCode,
  type MessageCreateOptions,
  MessageFlags,
  PermissionFlagsBits,
  type PublicThreadChannel,
  roleMention,
  SectionBuilder,
  subtext,
  TextDisplayBuilder,
  ThumbnailBuilder,
  TimestampStyles,
  time,
  unorderedList,
} from 'discord.js';
import { execute, Modal } from 'sunar';
import { Default, Destructive, getAppEmoji, Primary } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { errorMessage, successMessage } from '@/src/lib/format';

export const modal = new Modal({
  id: new RegExp(`^report:send-message-report_${SnowflakeRegex.source.slice(1, -1)}$`),
});

execute(modal, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const setting = await db.query.reportSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, interaction.guildId),
  });

  const reason = setting?.categories.length
    ? interaction.fields.getRadioGroup('reason')
    : interaction.fields.getTextInputValue('reason');

  if (!setting?.enabled) {
    return interaction.editReply({
      content: errorMessage('このサーバーでは通報機能を使用することはできません。'),
    });
  }

  const targetMessageId = interaction.customId.replace('report:send-message-report_', '');
  const targetMessage = await interaction.channel?.messages
    .fetch(targetMessageId)
    .catch(() => null);

  if (!targetMessage) {
    return interaction.editReply({
      content: errorMessage(
        '通報しようとしているメッセージは削除されたか、Botがアクセスできませんでした。',
      ),
    });
  }

  const channel = await interaction.guild.channels
    .fetch(setting.channel as string)
    .catch(() => null);
  const permission = channel?.permissionsFor(interaction.client.user);

  if (!channel) {
    return interaction.editReply({
      content:
        '送信先のチャンネルが存在しないため、通報を送信できませんでした。サーバーの管理者に連絡してください。',
    });
  }
  if (
    !permission?.has([
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.ManageThreads,
      PermissionFlagsBits.SendMessagesInThreads,
    ])
  ) {
    return interaction.editReply({
      content: errorMessage(
        '送信先のチャンネルの権限が不足しているため、通報を送信できませんでした。サーバーの管理者に連絡してください。',
      ),
    });
  }

  const components = [];

  if (setting.mentionRoles.length) {
    components.push(
      new TextDisplayBuilder().setContent(
        setting.mentionRoles.map((roleId) => roleMention(roleId)).join(' '),
      ),
    );
  }

  components.push(
    new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        heading(`${getAppEmoji(Destructive.flag)} メッセージの通報`, HeadingLevel.Three),
      ),
      new TextDisplayBuilder().setContent(
        unorderedList([
          `${getAppEmoji(Primary.userRound)} 報告者: ${interaction.user} ${inlineCode(interaction.user.username)}`,
          `${getAppEmoji(Primary.messageSquareText)} 理由: ${reason}`,
        ]),
      ),
    ),
    new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                heading('メッセージの情報', HeadingLevel.Three),
                unorderedList([
                  `${getAppEmoji(Default.userRound)} 送信者: ${targetMessage.author} ${inlineCode(targetMessage.author.username)}`,
                  `${getAppEmoji(Default.hash)} 送信先: ${targetMessage.channel} ${inlineCode(targetMessage.channel.name)}`,
                  `${getAppEmoji(Default.calendarClock)} 送信時刻: ${time(targetMessage.createdAt, TimestampStyles.LongDateShortTime)}`,
                ]),
              ].join('\n'),
            ),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(targetMessage.author.displayAvatarURL()),
          ),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(subtext('メッセージの内容はスレッドで確認できます。')),
      ),
    new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId('report:resolve')
        .setLabel('対応済み')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('report:ignore')
        .setLabel('対応なし')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setLabel('メッセージに移動')
        .setURL(targetMessage.url)
        .setStyle(ButtonStyle.Link),
    ),
  );

  const messageOption: MessageCreateOptions = {
    components,
    flags: [MessageFlags.IsComponentsV2],
    allowedMentions: { parse: ['roles'] },
  };

  try {
    let createdThread: PublicThreadChannel | ForumThreadChannel | null = null;

    switch (channel.type) {
      case ChannelType.GuildText:
        createdThread = await channel.send(messageOption).then((msg) =>
          msg.startThread({
            name: `${targetMessage.author.username} (ユーザーID: ${targetMessage.author.id}) への通報`,
          }),
        );
        break;
      case ChannelType.GuildForum:
        createdThread = await channel.threads.create({
          name: `${targetMessage.author.username} [${targetMessage.author.id}] への通報`,
          message: messageOption,
        });
        break;
    }

    await createdThread?.send({ forward: { message: targetMessage } });

    if (createdThread) {
      await db.insert(report).values({
        guildId: interaction.guildId,
        channelId: channel.id,
        threadId: createdThread.id,
        targetUserId: targetMessage.author.id,
        targetChannelId: targetMessage.channelId,
        targetMessageId: targetMessage.id,
      });
    }

    await interaction.editReply({
      content: successMessage(`通報を送信しました。${bold('ご協力ありがとうございます！')}`),
    });
  } catch (e) {
    console.error(e);
    await interaction.editReply({
      content: errorMessage('通報の送信中に問題が発生しました。時間をおいて再度送信してください。'),
    });
  }
});
