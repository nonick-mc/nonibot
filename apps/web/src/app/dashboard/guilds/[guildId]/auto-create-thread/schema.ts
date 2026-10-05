import { autoCreateThreadRule } from '@repo/database';
import { ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { SnowflakeRegex, snowflakeArraySchema } from '@/lib/discord/zod';

z.config(z.locales.ja());

const ruleSchema = createInsertSchema(autoCreateThreadRule, {
  channelId: (schema) => schema.regex(SnowflakeRegex, '無効なIDです。'),
  threadName: (schema) => schema.min(1).max(100),
  autoArchiveDuration: (schema) => schema.pipe(z.enum(ThreadAutoArchiveDuration)),
  initialThreadState: (schema) => schema.default('open'),
  ignoreRoles: () => snowflakeArraySchema.max(20, 'ロールは最大20個まで設定できます。'),
}).omit({ guildId: true, createdAt: true, updatedAt: true });

export const createRuleFormSchema = ruleSchema.omit({ enabled: true });
export const updateRuleFormSchema = ruleSchema.omit({ channelId: true });
