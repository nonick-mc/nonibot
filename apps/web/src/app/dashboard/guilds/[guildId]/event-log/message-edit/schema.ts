import { msgEditLogSetting } from '@repo/database';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { SnowflakeRegex, snowflakeArraySchema } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const formSchema = createInsertSchema(msgEditLogSetting, {
  enabled: (schema) => schema.default(false),
  channel: (schema) => schema.regex(SnowflakeRegex, '無効なIDです。').nullable().default(null),
  ignoreRoles: () => snowflakeArraySchema.max(10, 'ロールは最大10個まで設定できます。').default([]),
})
  .omit({ guildId: true, createdAt: true, updatedAt: true })
  .superRefine((v, ctx) => {
    if (v.enabled && !v.channel) {
      ctx.addIssue({
        code: 'custom',
        message: 'チャンネルが設定されていません。',
        path: ['channel'],
      });
    }
  });
