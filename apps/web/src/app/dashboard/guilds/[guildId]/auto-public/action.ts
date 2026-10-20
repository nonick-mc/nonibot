'use server';

import { autoPublicSetting } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { guildActionClient } from '@/lib/safe-action/client';
import { formSchema } from './schema';

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.autoPublicSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    const [after] = await db
      .insert(autoPublicSetting)
      .values({ guildId, ...parsedInput })
      .onConflictDoUpdate({ target: autoPublicSetting.guildId, set: parsedInput })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'auto_public',
      before,
      after,
    });

    revalidatePath('/');
  });
