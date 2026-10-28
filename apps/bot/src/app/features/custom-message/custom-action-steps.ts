import type { CustomActionStep } from '@repo/database';
import { renderPlaceholders } from '@repo/placeholders';
import { type ButtonInteraction, MessageFlags, roleMention } from 'discord.js';
import { errorMessage } from '@/src/lib/format';

export type StepResult =
  | { ok: true; outputs?: Record<string, string> }
  | { ok: false; error: string };

export function runStep(
  step: CustomActionStep,
  interaction: ButtonInteraction<'cached'>,
  params: Record<string, string>,
): Promise<StepResult> {
  switch (step.type) {
    case 'role-toggle':
      return toggleRole(step.config.roleId, interaction);
    case 'reply-message':
      return replyMessage(step.config, interaction, params);
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

  const action = hasRole ? '解除' : '付与';
  return ok
    ? { ok, outputs: { roleToggleRole: roleMention(roleId), roleToggleResult: action } }
    : {
        ok,
        error: errorMessage(
          `ロールを${action}できませんでした。サーバーの管理者に連絡してください。`,
        ),
      };
}

async function replyMessage(
  { components, ephemeral }: Extract<CustomActionStep, { type: 'reply-message' }>['config'],
  interaction: ButtonInteraction<'cached'>,
  params: Record<string, string>,
): Promise<StepResult> {
  const flags = ephemeral
    ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    : MessageFlags.IsComponentsV2;

  return interaction
    .reply({
      components: renderPlaceholders(components, params),
      flags,
      allowedMentions: { parse: [] },
    })
    .then(
      (): StepResult => ({ ok: true }),
      (): StepResult => ({
        ok: false,
        error: errorMessage(
          '指定されたメッセージを返信できませんでした。サーバーの管理者に連絡してください。',
        ),
      }),
    );
}
