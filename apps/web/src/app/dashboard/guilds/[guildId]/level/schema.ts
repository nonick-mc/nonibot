import { levelSetting } from '@repo/database';
import { levelNotifyMessagePlaceholders } from '@repo/placeholders';
import { ComponentType } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import {
  createMessageUserComponentsSchema,
  messageComponentsWithDefault,
  SnowflakeRegex,
  snowflakeArraySchema,
} from '@/lib/discord/zod';

z.config(z.locales.ja());

export const formSchema = createInsertSchema(levelSetting, {
  enabled: (schema) => schema.default(false),
  notifyMode: (schema) => schema.default('sameChannel'),
  notifyChannel: (schema) =>
    schema.regex(SnowflakeRegex, '無効なIDです。').nullable().default(null),
  notifyMessageComponents: messageComponentsWithDefault(
    createMessageUserComponentsSchema(levelNotifyMessagePlaceholders),
    [
      {
        type: ComponentType.TextDisplay,
        content: '**おめでとう!** {{user}} が**レベル{{level}}**になりました!',
      },
    ],
  ),
  ignoreChannels: () =>
    snowflakeArraySchema.max(50, 'チャンネルは最大50個まで設定できます。').default([]),
  ignoreRoles: () => snowflakeArraySchema.max(20, 'ロールは最大20個まで設定できます。').default([]),
})
  .omit({ guildId: true, createdAt: true, updatedAt: true })
  .superRefine((v, ctx) => {
    if (v.enabled && v.notifyMode === 'fixedChannel' && !v.notifyChannel) {
      ctx.addIssue({
        code: 'custom',
        message: 'チャンネルが設定されていません。',
        path: ['notifyChannel'],
      });
    }
  });
