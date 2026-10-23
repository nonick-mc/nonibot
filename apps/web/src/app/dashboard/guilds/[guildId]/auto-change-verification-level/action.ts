'use server';

import { autoChangeVerifyLevelSetting } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { guildActionClient } from '@/lib/safe-action/client';
import { formSchema } from './schema';

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.autoChangeVerifyLevelSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    // 無効化された場合、期間外に戻すために保存していた認証レベルは破棄
    const values = parsedInput.enabled ? parsedInput : { ...parsedInput, defaultLevel: null };

    const [after] = await db
      .insert(autoChangeVerifyLevelSetting)
      .values({ guildId, ...values })
      .onConflictDoUpdate({ target: autoChangeVerifyLevelSetting.guildId, set: values })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'auto_change_verify_level',
      before,
      after,
    });

    revalidatePath('/');
  });
