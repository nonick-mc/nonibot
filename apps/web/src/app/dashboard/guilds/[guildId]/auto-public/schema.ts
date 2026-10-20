import { autoPublicSetting } from '@repo/database';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { snowflakeArraySchema } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const formSchema = createInsertSchema(autoPublicSetting, {
  enabled: (schema) => schema.default(false),
  channels: () =>
    snowflakeArraySchema.max(20, 'チャンネルは最大20個まで設定できます。').default([]),
  reactOnFailure: (schema) => schema.default(true),
  ignoreRoles: () => snowflakeArraySchema.max(20, 'ロールは最大20個まで設定できます。').default([]),
  ignoreWebhooks: (schema) => schema.default(false),
}).omit({ guildId: true, createdAt: true, updatedAt: true });
