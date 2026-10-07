import { autoCreateThreadRule } from '@repo/database';
import { autoThreadPlaceholders } from '@repo/placeholders';
import { autoCreateThreadActions } from '@repo/shared';
import { ComponentType, ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  createMessageUserComponentsSchema,
  SnowflakeRegex,
  snowflakeArraySchema,
} from '@/lib/discord/zod';

z.config(z.locales.ja());

const ruleSchema = createInsertSchema(autoCreateThreadRule, {
  channelId: (schema) => schema.regex(SnowflakeRegex, '無効なIDです。'),
  threadName: (schema) => schema.min(1).max(100),
  autoArchiveDuration: (schema) => schema.pipe(z.enum(ThreadAutoArchiveDuration)),
  initialThreadState: (schema) => schema.default('open'),
  ignoreRoles: () => snowflakeArraySchema.max(20, 'ロールは最大20個まで設定できます。'),
  messageComponents: createMessageUserComponentsSchema(
    autoThreadPlaceholders,
    autoCreateThreadActions,
  ).default([
    {
      type: ComponentType.Container,
      components: [
        {
          type: ComponentType.TextDisplay,
          content: '**{{userDisplayName}}** さんのスレッドです。',
        },
      ],
      accent_color: 5763719,
    },
  ]),
}).omit({ guildId: true, createdAt: true, updatedAt: true });

export const createRuleFormSchema = ruleSchema.pick({ channelId: true });
export const updateRuleFormSchema = ruleSchema.omit({ channelId: true });
