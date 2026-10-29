'use server';

import { auditLog, type CustomActionStep, customAction } from '@repo/database';
import { isAssignableRole } from '@repo/shared';
import { and, count, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getRoles } from '@/lib/discord/api';
import { getAssignableRoleRules } from '@/lib/discord/assignable-role';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { createFormSchema, deleteFormSchema, maxCustomActions, updateFormSchema } from './schema';

/**
 * ユーザーが持っていない権限を得られる処理(`role-toggle`)について、設定できるロールか検証する。
 * `previous`を指定すると、そこに含まれていない処理(新しく追加・変更された処理)だけを検証する。
 */
async function assertAllowedSteps(
  guildId: string,
  discordUserId: string,
  steps: CustomActionStep[],
  previous: CustomActionStep[] = [],
) {
  const previousRoleIds = previous.flatMap((s) =>
    s.type === 'role-toggle' ? s.config.roleId : [],
  );
  const roleIds = steps
    .flatMap((s) => (s.type === 'role-toggle' ? s.config.roleId : []))
    .filter((id) => !previousRoleIds.includes(id));
  if (!roleIds.length) return;

  const [roles, rules] = await Promise.all([
    getRoles(guildId),
    getAssignableRoleRules(guildId, discordUserId),
  ]);
  if (!rules) {
    throw new ActionClientError(
      'ロールを付与・解除する処理を設定するには「ロールの管理」権限が必要です。',
    );
  }
  const isValid = roleIds.every((id) => {
    const role = roles.find((r) => r.id === id);
    return role && isAssignableRole(role, rules);
  });
  if (!isValid) throw new ActionClientError('設定できないロールが含まれています。');
}

const findAction = async (guildId: string, id: string) => {
  const found = await db.query.customAction.findFirst({
    where: and(eq(customAction.id, id), eq(customAction.guildId, guildId)),
  });
  if (!found) throw new ActionClientError('アクションが見つかりません。');
  return found;
};

export const createCustomAction = guildActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput: { name }, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    // 作成直後は処理を持たない。テンプレートの内容は、編集ページのフォームにセットされる
    const steps: CustomActionStep[] = [];

    const id = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${guildId}))`);
      const [{ total }] = await tx
        .select({ total: count() })
        .from(customAction)
        .where(eq(customAction.guildId, guildId));
      if (total >= maxCustomActions) {
        throw new ActionClientError(
          `作成できるアクションは${maxCustomActions}件までです。不要なアクションを削除してください。`,
        );
      }
      const [created] = await tx
        .insert(customAction)
        .values({ guildId, name, steps })
        .returning({ id: customAction.id });
      return created.id;
    });

    await db.insert(auditLog).values({
      guildId,
      authorId: session.user.id,
      targetName: 'custom_action',
      actionType: 'create_custom_action',
      after: { name, steps },
    });

    revalidatePath('/');
    return { id };
  });

export const updateCustomAction = guildActionClient
  .inputSchema(updateFormSchema)
  .action(
    async ({
      parsedInput: { id, name, steps },
      bindArgsParsedInputs: [guildId],
      ctx: { session },
    }) => {
      const saved = await findAction(guildId, id);
      await assertAllowedSteps(guildId, session.user.discordUserId, steps, saved.steps);

      await db.update(customAction).set({ name, steps }).where(eq(customAction.id, id));

      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_action',
        actionType: 'update_custom_action',
        before: { name: saved.name, steps: saved.steps },
        after: { name, steps },
      });

      revalidatePath('/');
    },
  );

export const deleteCustomAction = guildActionClient
  .inputSchema(deleteFormSchema)
  .action(async ({ parsedInput: { id }, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const saved = await findAction(guildId, id);

    await db.delete(customAction).where(eq(customAction.id, id));

    await db.insert(auditLog).values({
      guildId,
      authorId: session.user.id,
      targetName: 'custom_action',
      actionType: 'delete_custom_action',
      before: { name: saved.name, steps: saved.steps },
    });

    revalidatePath('/');
  });
