import { z } from 'zod';
import { createMessageUserComponentsSchema, SnowflakeRegex } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const editorFormSchema = z.object({
  components: createMessageUserComponentsSchema(),
});

export const sendFormSchema = editorFormSchema.extend({
  channelId: z.string().regex(SnowflakeRegex, 'チャンネルを選択してください。'),
});
