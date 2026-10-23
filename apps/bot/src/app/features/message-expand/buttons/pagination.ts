import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { Button, execute } from 'sunar';
import { errorMessage } from '@/src/lib/format';
import {
  buildComponents,
  buildPages,
  canViewChannel,
  fetchSource,
  isNsfwChannel,
  MessageExpandCustomIdPrefix,
} from '../expand';

export const button = new Button({ id: new RegExp(`^${MessageExpandCustomIdPrefix}(?!page$)`) });

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  // 操作できるのはURLを送信した本人(返信元が削除されている場合は、メッセージの管理権限を持つメンバー)のみ
  const refId = interaction.message.reference?.messageId;
  const ref = refId ? await interaction.channel?.messages.fetch(refId).catch(() => null) : null;
  const allowed = ref
    ? ref.author.id === interaction.user.id
    : interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages);
  if (!allowed) {
    return interaction.reply({
      content: errorMessage('この操作はURLを送信したユーザーのみ実行できます。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  const [, action, pageStr, guildId, channelId, messageId] = interaction.customId.split(':');

  if (action === 'delete') {
    await interaction.message.delete().catch(() => null);
    return;
  }

  if (!(guildId && channelId && messageId)) return;
  const source = await fetchSource(interaction.client, { guildId, channelId, messageId });
  if (!source) {
    return interaction.reply({
      content: errorMessage('展開元のメッセージを取得できませんでした。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  // ページ切り替え時に権限やチャンネル制限を再検証
  const canView = await canViewChannel(source.guild, source.channel, interaction.user.id);
  const nsfwMismatch =
    interaction.channel && isNsfwChannel(source.channel) && !isNsfwChannel(interaction.channel);
  if (!canView || nsfwMismatch) {
    return interaction.reply({
      content: errorMessage('このメッセージを表示する権限がありません。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  const pages = buildPages(source.message);
  const page = Math.min(
    Math.max(Number(pageStr) + (action === 'next' ? 1 : -1), 0),
    pages.length - 1,
  );
  const embed = pages[page];
  if (!embed) return;
  await interaction.update({
    embeds: [embed],
    components: buildComponents(page, pages.length, { guildId, channelId, messageId }),
  });
});
