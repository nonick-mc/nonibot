import { customActionBasePlaceholders } from '@repo/placeholders';
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
      components: createMessageUserComponentsSchema(customActionBasePlaceholders),
      ephemeral: z.boolean(),
    }),
  }),
]);

export const stepsSchema = z
  .array(stepSchema)
  .refine((steps) => new Set(steps.map((s) => s.type)).size === steps.length, {
    error: '同じ種類のアクションは複数追加できません。',
  });

const nameSchema = z
  .string()
  .trim()
  .min(1, 'アクション名を入力してください。')
  .max(50, 'アクション名は50文字以内で入力してください。');

export const createFormSchema = z.object({
  name: nameSchema,
});

export const updateFormSchema = z.object({
  id: z.uuid(),
  name: nameSchema,
  steps: stepsSchema,
});

export const deleteFormSchema = z.object({
  id: z.uuid(),
});
