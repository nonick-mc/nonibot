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

    const [after] = await db
      .insert(autoChangeVerifyLevelSetting)
      .values({ guildId, ...parsedInput })
      .onConflictDoUpdate({ target: autoChangeVerifyLevelSetting.guildId, set: parsedInput })
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
