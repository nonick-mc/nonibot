import type { CustomActionStep } from '@repo/database';
import { type ButtonInteraction, roleMention } from 'discord.js';
import { errorMessage, successMessage } from '@/src/lib/format';

export type StepResult = { ok: boolean; message: string };

export function runStep(
  step: CustomActionStep,
  interaction: ButtonInteraction<'cached'>,
): Promise<StepResult> {
  switch (step.type) {
    case 'role-toggle':
      return toggleRole(step.config.roleId, interaction);
  }
}

async function toggleRole(
  roleId: string,
  interaction: ButtonInteraction<'cached'>,
): Promise<StepResult> {
  const roles = interaction.member.roles;
  const hasRole = roles.cache.has(roleId);
  const action = hasRole ? '解除' : '付与';

  const ok = await (hasRole
    ? roles.remove(roleId, 'カスタムアクション')
    : roles.add(roleId, 'カスタムアクション')
  ).then(
    () => true,
    () => false,
  );

  return {
    ok,
    message: ok
      ? successMessage(`${roleMention(roleId)}を${action}しました。`)
      : errorMessage(`ロールを${action}できませんでした。サーバーの管理者に連絡してください。`),
  };
}
