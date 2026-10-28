import type { CustomActionStep } from '@repo/database';
import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { errorMessage } from '@/src/lib/format';

/** 失敗したときは、ユーザーに返信するエラーメッセージを持つ */
export type StepResult = { ok: true } | { ok: false; error: string };

/** アクションのステップを1つ実行する。`type`を増やすときは`case`を追加する */
export function runStep(
  step: CustomActionStep,
  interaction: ButtonInteraction<'cached'>,
): Promise<StepResult> {
  switch (step.type) {
    case 'role-toggle':
      return toggleRole(step.config.roleId, interaction);
    case 'reply-message':
      return replyMessage(step.config, interaction);
  }
}

async function toggleRole(
  roleId: string,
  interaction: ButtonInteraction<'cached'>,
): Promise<StepResult> {
  const roles = interaction.member.roles;
  const hasRole = roles.cache.has(roleId);

  const ok = await (hasRole
    ? roles.remove(roleId, 'カスタムアクション')
    : roles.add(roleId, 'カスタムアクション')
  ).then(
    () => true,
    () => false,
  );

  return ok
    ? { ok }
    : {
        ok,
        error: errorMessage(
          `ロールを${hasRole ? '解除' : '付与'}できませんでした。サーバーの管理者に連絡してください。`,
        ),
      };
}

async function replyMessage(
  { components, ephemeral }: Extract<CustomActionStep, { type: 'reply-message' }>['config'],
  interaction: ButtonInteraction<'cached'>,
): Promise<StepResult> {
  const flags = ephemeral
    ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    : MessageFlags.IsComponentsV2;

  return interaction.reply({ components, flags, allowedMentions: { parse: [] } }).then(
    (): StepResult => ({ ok: true }),
    (): StepResult => ({
      ok: false,
      error: errorMessage(
        '指定されたメッセージを返信できませんでした。サーバーの管理者に連絡してください。',
      ),
    }),
  );
}
