import { msgExpandSetting } from '@repo/database';
import { ChannelType } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { snowflakeArraySchema } from '@/lib/discord/zod';

z.config(z.locales.ja());

export const ignorePrefixes = ['!', '?', '.', '#', '$', '%', '&', '^', '<'] as const;

export const ignoreChannelTypes = [
  ChannelType.GuildAnnouncement,
  ChannelType.GuildVoice,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
] as const;

const uniqueArray = (v: unknown[]) => new Set(v).size === v.length;

export const formSchema = createInsertSchema(msgExpandSetting, {
  enabled: (schema) => schema.default(false),
  allowExternalGuild: (schema) => schema.default(false),
  onlyOwnGuild: (schema) => schema.default(false),
  ignoreChannels: () =>
    snowflakeArraySchema.max(50, 'チャンネルは最大50個まで設定できます。').default([]),
  ignoreChannelTypes: () =>
    z
      .array(z.literal(ignoreChannelTypes))
      .refine(uniqueArray, '重複した値が含まれています。')
      .default([]),
  ignorePrefixes: () =>
    z
      .array(z.enum(ignorePrefixes))
      .max(5, 'プレフィックスは最大5個まで設定できます。')
      .refine(uniqueArray, '重複した値が含まれています。')
      .default([]),
}).omit({ guildId: true, createdAt: true, updatedAt: true });
