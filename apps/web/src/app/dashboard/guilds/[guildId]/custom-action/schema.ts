import { z } from 'zod';
import { createMessageUserComponentsSchema, SnowflakeRegex } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const maxCustomActions = 20;

const stepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('role-toggle'),
    config: z.object({ roleId: z.string().regex(SnowflakeRegex, 'ロールを選択してください。') }),
  }),
  z.object({
    type: z.literal('reply-message'),
    config: z.object({
      components: createMessageUserComponentsSchema(),
      ephemeral: z.boolean(),
    }),
  }),
]);

export const stepsSchema = z
  .array(stepSchema)
  .min(1, '処理を1つ以上追加してください。')
  .refine((steps) => new Set(steps.map((s) => s.type)).size === steps.length, {
    error: '同じ種類の処理は1つのアクションに複数追加できません。',
  });

export const createFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'アクション名を入力してください。')
    .max(50, 'アクション名は50文字以内で入力してください。'),
});

export const updateFormSchema = createFormSchema.extend({
  id: z.uuid(),
  steps: stepsSchema,
});

export const deleteFormSchema = z.object({
  id: z.uuid(),
});
