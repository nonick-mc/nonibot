import { leaveMessageSetting } from '@repo/database';
import { leaveMessagePlaceholders } from '@repo/placeholders';
import { ComponentType } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { createMessageUserComponentsSchema, SnowflakeRegex } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const formSchema = createInsertSchema(leaveMessageSetting, {
  enabled: (schema) => schema.default(false),
  channel: (schema) => schema.regex(SnowflakeRegex, '無効なIDです').nullable().default(null),
  ignoreBot: (schema) => schema.default(false),
  messageComponents: createMessageUserComponentsSchema(leaveMessagePlaceholders).default([
    {
      type: ComponentType.TextDisplay,
      content: '**{{userName}}** さんがサーバーを退室しました👋',
    },
  ]),
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
