import { reportSetting } from '@repo/database';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { SnowflakeRegex, snowflakeArraySchema, snowflakeIdSchema } from '@/lib/discord/zod';

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
  .refine((v) => v.length === 0 || v.length >= 2, 'カテゴリの数は2個以上である必要があります。');

export const formSchema = createInsertSchema(reportSetting, {
  enabled: (schema) => schema.default(false),
  channel: (schema) => schema.regex(SnowflakeRegex, '無効なIDです').nullable().default(null),
  resolvedForumTag: () => snowflakeIdSchema.default(null),
  ignoredForumTag: () => snowflakeIdSchema.default(null),
  includeModerator: (schema) => schema.default(false),
  showModerateLog: (schema) => schema.default(true),
  ignoreRoles: () => snowflakeArraySchema.max(10, 'ロールは最大10個まで設定できます。').default([]),
  mentionRoles: () =>
    snowflakeArraySchema.max(10, 'ロールは最大10個まで設定できます。').default([]),
  messageCategories: categoriesSchema.default([
    { id: crypto.randomUUID(), label: 'スパム' },
    { id: crypto.randomUUID(), label: '攻撃またはハラスメント' },
    { id: crypto.randomUUID(), label: '有害な誤情報または暴力の是認' },
    { id: crypto.randomUUID(), label: '個人を特定している情報を晒している' },
    { id: crypto.randomUUID(), label: 'その他' },
  ]),
  userCategories: categoriesSchema.default([
    { id: crypto.randomUUID(), label: '不審またはスパムのアカウント' },
    { id: crypto.randomUUID(), label: 'Discordを使える最低年齢に達していない' },
    { id: crypto.randomUUID(), label: 'なりすまし、欺瞞、詐欺' },
    { id: crypto.randomUUID(), label: 'その他' },
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
