'use server';

import { timeoutLogSetting } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { guildActionClient } from '@/lib/safe-action/client';
import { formSchema } from './schema';

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.timeoutLogSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    const [after] = await db
      .insert(timeoutLogSetting)
      .values({ guildId, ...parsedInput })
      .onConflictDoUpdate({ target: timeoutLogSetting.guildId, set: parsedInput })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'timeout_log',
      before,
      after,
    });

    revalidatePath('/');
  });
