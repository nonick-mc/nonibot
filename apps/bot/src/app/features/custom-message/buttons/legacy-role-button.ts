import { MessageFlags, roleMention } from 'discord.js';
import { Button, execute } from 'sunar';
import { errorMessage, successMessage } from '@/src/lib/format';

// TODO: v5のカスタムIDはリリース数ヶ月後に削除する
const LegacyRoleButtonCustomIdPrefix = 'nonick-js:roleButton-';
export const button = new Button({
  id: new RegExp(`^${LegacyRoleButtonCustomIdPrefix}\\d{17,19}$`),
});

const SuccessMessageLifetime = 3_000;

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const roleId = interaction.customId.slice(LegacyRoleButtonCustomIdPrefix.length);
  const roles = interaction.member.roles;
  const hasRole = roles.cache.has(roleId);
  const action = hasRole ? '解除' : '付与';

  const ok = await (hasRole
    ? roles.remove(roleId, 'ロールボタン')
    : roles.add(roleId, 'ロールボタン')
  ).then(
    () => true,
    () => false,
  );

  await interaction.reply({
    content: ok
      ? successMessage(`${roleMention(roleId)}を${action}しました。`)
      : errorMessage(`ロールを${action}できませんでした。サーバーの管理者に連絡してください。`),
    flags: [MessageFlags.Ephemeral],
    allowedMentions: { parse: [] },
  });
  if (ok) setTimeout(() => interaction.deleteReply().catch(() => {}), SuccessMessageLifetime);
});
