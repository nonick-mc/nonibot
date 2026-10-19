import { Links } from '@repo/shared';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  ContainerBuilder,
  HeadingLevel,
  heading,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  subtext,
  TextDisplayBuilder,
  TimestampStyles,
  time,
} from 'discord.js';
import { Button, execute } from 'sunar';
import { getAppEmoji, Warning } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { errorMessage, successMessage } from '@/src/lib/format';
import { createCaptcha } from '../captcha';

// TODO: 旧IDはリリース数ヶ月後に削除する
export const button = new Button({ id: /^(verification:verify|nonick-js:verify)$/ });

const MaxAttempts = 3;
const AnswerTime = 60_000;
const Cooldown = 5 * 60_000;

const blockedUsers = new Set<string>();

const unavailable = () =>
  errorMessage('現在この機能を利用できません。サーバーの管理者に連絡してください。');
const grantFailed = () =>
  errorMessage('ロールを付与できませんでした。サーバーの管理者にご連絡ください。');

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  const reply = (content: string) =>
    interaction.reply({ content, flags: [MessageFlags.Ephemeral] });

  const setting = await db.query.verificationSetting.findFirst({
    where: (s, { eq }) => eq(s.guildId, interaction.guildId),
  });
  if (!setting?.enabled || !setting.role) return reply(unavailable());

  const role = await interaction.guild.roles.fetch(setting.role).catch(() => null);
  if (!role) return reply(unavailable());
  if (interaction.member.roles.cache.has(role.id))
    return reply(successMessage('既に認証されています。'));

  switch (setting.captchaType) {
    case 'button': {
      const ok = await interaction.member.roles.add(role.id, '認証').then(
        () => true,
        () => false,
      );
      return reply(ok ? successMessage('認証に成功しました！') : grantFailed());
    }
    case 'image':
      return verifyByImage(interaction, role.id);
    case 'web':
      return interaction.reply({
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                [
                  heading('下のボタンから認証ページにアクセスしてください', HeadingLevel.Three),
                  subtext(
                    `${getAppEmoji(Warning.triangleAlert)} ${interaction.client.user}はパスワードの入力やQRコードの読み取りを要求することは決してありません。`,
                  ),
                ].join('\n'),
              ),
            )
            .addActionRowComponents(
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel('クリックして認証を続行')
                  .setURL(`${Links.Verify}/${interaction.guildId}`)
                  .setStyle(ButtonStyle.Link),
              ),
            ),
        ],
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      });
  }
});

async function verifyByImage(interaction: ButtonInteraction<'cached'>, roleId: string) {
  const { user } = interaction;
  if (blockedUsers.has(user.id)) {
    return interaction.reply({
      content: errorMessage(
        '現在別の認証を行っているか、認証に失敗したため、しばらく新たな認証を行うことはできません。',
      ),
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const { image, text } = createCaptcha();
  const sent = await user
    .send({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              heading(`${interaction.guild.name} - 認証`, HeadingLevel.Three),
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                '画像に表示された緑色の文字列をこのDMに送信してください。',
                subtext('一定時間経過したり、複数回間違えると新しく認証を開始する必要があります。'),
              ].join('\n'),
            ),
          )
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL('attachment://nonibot-captcha.jpeg'),
            ),
          )
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              subtext(
                `${getAppEmoji(Warning.triangleAlert)} ${interaction.client.user}はパスワードの入力やQRコードの読み取りを要求することは決してありません。`,
              ),
            ),
          ),
      ],
      files: [new AttachmentBuilder(image, { name: 'nonibot-captcha.jpeg' })],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => null);

  if (!sent) {
    return interaction.editReply(
      errorMessage('この認証を行うにはBOTからDMを受け取れるように設定する必要があります。'),
    );
  }

  blockedUsers.add(user.id);
  await interaction.editReply(successMessage('DMで認証を続けてください。'));

  let attempts = 0;
  const collector = (await user.createDM()).createMessageCollector({
    filter: (m) => m.author.id === user.id,
    time: AnswerTime,
  });

  collector.on('collect', async (message) => {
    if (message.content.trim().toUpperCase() === text) {
      collector.stop('success');
      const ok = await interaction.member.roles.add(roleId, '認証').then(
        () => true,
        () => false,
      );
      return user.send(ok ? successMessage('認証に成功しました！') : grantFailed()).catch(() => {});
    }
    if (++attempts >= MaxAttempts) {
      collector.stop('failed');
      const retryAt = new Date(Date.now() + Cooldown);
      return user
        .send(
          errorMessage(
            `試行回数を超えて検証に失敗しました。次回の検証は${time(retryAt, TimestampStyles.ShortTime)} (${time(retryAt, TimestampStyles.RelativeTime)})から可能になります。`,
          ),
        )
        .catch(() => {});
    }
    return user.send(errorMessage('認証コードが間違っています。')).catch(() => {});
  });

  collector.on('end', (_, reason) => {
    if (reason === 'failed') setTimeout(() => blockedUsers.delete(user.id), Cooldown);
    else blockedUsers.delete(user.id);
    if (reason === 'time') {
      user
        .send(errorMessage('制限時間を超えました。もう一度認証を開始してください。'))
        .catch(() => {});
    }
  });
}
