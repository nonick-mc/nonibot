import { report } from '@repo/database';
import { SnowflakeRegex } from '@repo/shared';
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
  inlineCode,
  type MessageCreateOptions,
  MessageFlags,
  PermissionFlagsBits,
  type PublicThreadChannel,
  roleMention,
  TextDisplayBuilder,
  unorderedList,
} from 'discord.js';
import { execute, Modal } from 'sunar';
import { getMemberInfoContainers, getUserInfoContainer } from '@/src/app/shared/user-info';
import { Destructive, getAppEmoji, Primary } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { errorMessage, successMessage } from '@/src/lib/format';
import { addReporterToReport, deleteReport, findUserReport } from '../notify-report-thread';

export const modal = new Modal({
  id: new RegExp(`^report:send-user-report_${SnowflakeRegex.source.slice(1, -1)}$`),
});

execute(modal, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const setting = await db.query.reportSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, interaction.guildId),
  });

  const reason = setting?.userCategories.length
    ? interaction.fields.getRadioGroup('reason')
    : interaction.fields.getTextInputValue('reason');
  const comment = setting?.userCategories.length
    ? interaction.fields.getTextInputValue('comment')
    : null;

  if (!setting?.enabled) {
    return interaction.editReply({
      content: errorMessage('このサーバーでは通報機能を使用することはできません。'),
    });
  }

  const targetUserId = interaction.customId.replace('report:send-user-report_', '');
  const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
  const targetUser =
    targetMember?.user ?? (await interaction.client.users.fetch(targetUserId).catch(() => null));

  if (!targetUser) {
    return interaction.editReply({
      content: errorMessage('通報しようとしているユーザーが見つかりませんでした。'),
    });
  }

  const existingReport = await findUserReport(interaction.guildId, targetUser.id);

  if (existingReport) {
    const existingThread = await interaction.guild.channels
      .fetch(existingReport.threadId)
      .catch(() => null);

    if (existingThread?.isThread()) {
      if (!existingReport.reporterIds.includes(interaction.user.id)) {
        await existingThread
          .send({
            components: [
              new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  heading(`${getAppEmoji(Destructive.flag)} 重複した通報`, HeadingLevel.Three),
                ),
                new TextDisplayBuilder().setContent(
                  unorderedList([
                    `${getAppEmoji(Primary.userRoundPen)} 報告者: ${interaction.user} ${inlineCode(interaction.user.username)}`,
                    `${getAppEmoji(Primary.messageSquareText)} 理由: ${reason?.split('\n').join(' ')}`,
                    ...(comment
                      ? [`${getAppEmoji(Primary.messageSquareText)} コメント: ${comment.split('\n').join(' ')}`]
                      : []),
                  ]),
                ),
              ),
            ],
            flags: [MessageFlags.IsComponentsV2],
            allowedMentions: { parse: [] },
          })
          .catch(() => null);

        await addReporterToReport(existingReport.id, interaction.user.id);
      }

      return interaction.editReply({
        content: successMessage(`通報を送信しました。${bold('ご協力ありがとうございます！')}`),
      });
    }

    // 通報先のスレッドが見つからない場合は不整合なレコードとして削除
    await deleteReport(existingReport.id);
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
        heading(`${getAppEmoji(Destructive.flag)} ユーザーの通報`, HeadingLevel.Three),
      ),
      new TextDisplayBuilder().setContent(
        unorderedList([
          `${getAppEmoji(Primary.userRoundPen)} 報告者: ${interaction.user} ${inlineCode(interaction.user.username)}`,
          `${getAppEmoji(Primary.messageSquareText)} 理由: ${reason?.split('\n').join(' ')}`,
          ...(comment
            ? [`${getAppEmoji(Primary.messageSquareText)} コメント: ${comment.split('\n').join(' ')}`]
            : []),
        ]),
      ),
    ),
    ...(targetMember
      ? getMemberInfoContainers(targetMember, true)
      : [getUserInfoContainer(targetUser)]),
    new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId('report:resolve')
        .setLabel('対応済み')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('report:ignore')
        .setLabel('対応なし')
        .setStyle(ButtonStyle.Danger),
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
            name: `${targetUser.username} (ユーザーID: ${targetUser.id}) への通報`,
          }),
        );
        break;
      case ChannelType.GuildForum:
        createdThread = await channel.threads.create({
          name: `${targetUser.username} [${targetUser.id}] への通報`,
          message: messageOption,
        });
        break;
    }

    if (createdThread) {
      await db.insert(report).values({
        guildId: interaction.guildId,
        channelId: channel.id,
        threadId: createdThread.id,
        targetUserId: targetUser.id,
        reporterIds: [interaction.user.id],
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
