import { ComponentType, MessageFlags } from 'discord.js';
import { execute, SelectMenu } from 'sunar';
import { errorMessage, successMessage } from '@/src/lib/format';

// TODO: v5のカスタムIDはリリース数ヶ月後に削除する
export const selectMenu = new SelectMenu({
  id: /^nonick-js:roleSelectMenu(-[1-5])?$|^reactionRole$/,
  type: ComponentType.StringSelect,
});

const SuccessMessageLifetime = 3_000;

execute(selectMenu, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  if (interaction.message.flags.has(MessageFlags.Ephemeral)) return interaction.update({});

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const roles = interaction.member.roles;
  const unselected = interaction.component.options
    .map((option) => option.value)
    .filter((value) => !interaction.values.includes(value));

  const removed = await roles.remove(unselected, 'ロール選択メニュー').then(
    () => true,
    () => false,
  );
  const added = await roles.add(interaction.values, 'ロール選択メニュー').then(
    () => true,
    () => false,
  );

  if (!(removed && added)) {
    return interaction.followUp({
      content: errorMessage('一部のロールを付与・解除できませんでした。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.followUp({
    content: successMessage('ロールを更新しました。'),
    flags: [MessageFlags.Ephemeral],
  });
  setTimeout(() => interaction.deleteReply().catch(() => {}), SuccessMessageLifetime);
});
