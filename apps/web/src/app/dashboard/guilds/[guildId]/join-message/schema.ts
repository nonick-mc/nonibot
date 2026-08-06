import { joinMessageSetting } from '@repo/database';
import { joinMessagePlaceholders } from '@repo/placeholders';
import { ComponentType } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { createMessageUserComponentsSchema, SnowflakeRegex } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const formSchema = createInsertSchema(joinMessageSetting, {
  enabled: (schema) => schema.default(false),
  channel: (schema) => schema.regex(SnowflakeRegex, '無効なIDです。').nullable().default(null),
  sendTrigger: (schema) => schema.default('joined'),
  ignoreBot: (schema) => schema.default(false),
  messageComponents: createMessageUserComponentsSchema(joinMessagePlaceholders).default([
    {
      type: ComponentType.Container,
      components: [
        {
          type: ComponentType.TextDisplay,
          content: '### WELCOME',
        },
        {
          type: ComponentType.TextDisplay,
          content: '{{user}} **({{userName}})** さん、**{{serverName}}**へようこそ！',
        },
      ],
      accent_color: 5763719,
    },
  ]),
  dmEnabled: (schema) => schema.default(false),
  dmMessageComponents: createMessageUserComponentsSchema(joinMessagePlaceholders).default([
    {
      type: ComponentType.Container,
      components: [
        {
          type: ComponentType.TextDisplay,
          content: '### WELCOME',
        },
        {
          type: ComponentType.TextDisplay,
          content: '{{user}} **({{userName}})** さん、**{{serverName}}**へようこそ！',
        },
      ],
      accent_color: 5763719,
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
