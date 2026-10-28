import { roleButtonAllowedComponent } from '@repo/shared';
import { z } from 'zod';
import { createMessageUserComponentsSchema, SnowflakeRegex } from '@/lib/discord/zod';

z.config(z.locales.ja());

/** 保存できるメッセージの上限 */
export const maxSavedMessages = 20;

const componentsSchema = createMessageUserComponentsSchema(undefined, [roleButtonAllowedComponent]);
const nameSchema = z.string().trim().min(1, '保存名を入力してください。').max(50);

export const editorFormSchema = z.object({
  components: componentsSchema,
});

export const channelFormSchema = z.object({
  channelId: z.string().regex(SnowflakeRegex, 'チャンネルを選択してください。'),
  save: z.boolean(),
  name: z.string().trim().max(50, '保存名は50文字以内で入力してください。'),
});

export const sendFormSchema = z.object({
  channelId: z.string().regex(SnowflakeRegex, '無効なIDです。'),
  components: componentsSchema,
  name: nameSchema.optional(),
});

export const editFormSchema = z.object({
  id: z.uuid(),
  components: componentsSchema,
});

export const deleteFormSchema = z.object({
  id: z.uuid(),
  deleteDiscordMessage: z.boolean(),
});

export const renameFormSchema = z.object({
  id: z.uuid(),
  name: nameSchema,
});
