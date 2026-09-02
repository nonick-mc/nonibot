import { reportSetting } from '@repo/database';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { SnowflakeRegex } from '@/lib/discord/zod';

z.config(z.locales.ja());

const categoriesSchema = z
  .array(
    z.object({
      id: z.string().default(() => crypto.randomUUID()),
      label: z
        .string()
        .min(1, '1文字以上100文字以下である必要があります。')
        .max(100, '1文字以上100文字以下である必要があります。'),
    }),
  )
  .max(10, 'カテゴリの数は10個以下である必要があります。')
  .refine((v) => v.length === 0 || v.length >= 2, 'カテゴリの数は2個以上である必要があります。')
  .default([]);

export const formSchema = createInsertSchema(reportSetting, {
  enabled: (schema) => schema.default(false),
  channel: (schema) => schema.regex(SnowflakeRegex, '無効なIDです').nullable().default(null),
  forumCompletedTag: (schema) =>
    schema.regex(SnowflakeRegex, '無効なIDです').nullable().default(null),
  forumIgnoredTag: (schema) =>
    schema.regex(SnowflakeRegex, '無効なIDです').nullable().default(null),
  includeModerator: (schema) => schema.default(false),
  showModerateLog: (schema) => schema.default(true),
  ignoreRoles: () =>
    z
      .array(z.string().regex(SnowflakeRegex, '無効なIDです'))
      .max(10, 'ロールは最大10個まで設定できます。')
      .refine((v) => new Set(v).size === v.length, '重複した値が含まれています。')
      .default([]),
  mentionRoles: () =>
    z
      .array(z.string().regex(SnowflakeRegex, '無効なIDです'))
      .max(10, 'ロールは最大10個まで設定できます。')
      .refine((v) => new Set(v).size === v.length, '重複した値が含まれています。')
      .default([]),
  messageCategories: categoriesSchema,
  userCategories: categoriesSchema,
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
