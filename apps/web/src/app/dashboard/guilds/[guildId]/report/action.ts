'use server';

import { reportSetting } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { guildActionClient } from '@/lib/safe-action/client';
import { formSchema } from './schema';

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.reportSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    // categories.idはhydrationエラー対策のためDBには保存しない
    const categories = parsedInput.categories.map(({ id: _id, ...rest }) => rest);
    const values = { ...parsedInput, categories };

    const [after] = await db
      .insert(reportSetting)
      .values({ guildId, ...values })
      .onConflictDoUpdate({ target: reportSetting.guildId, set: values })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'report',
      before,
      after,
    });

    revalidatePath('/');
  });
