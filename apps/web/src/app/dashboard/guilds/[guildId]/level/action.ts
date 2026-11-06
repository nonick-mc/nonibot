'use server';

import { levelSetting } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { guildActionClient } from '@/lib/safe-action/client';
import { formSchema } from './schema';

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.levelSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    const [after] = await db
      .insert(levelSetting)
      .values({ guildId, ...parsedInput })
      .onConflictDoUpdate({ target: levelSetting.guildId, set: parsedInput })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'level',
      before,
      after,
    });

    revalidatePath('/');
  });
