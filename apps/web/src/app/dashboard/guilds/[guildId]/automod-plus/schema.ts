import { autoModSetting } from '@repo/database';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { SnowflakeRegex, snowflakeArraySchema } from '@/lib/discord/zod';

z.config(z.locales.ja());

const domainRegex = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,63}$/;

// テキストエリアの入力(カンマ・改行区切り)を配列に変換する
export const MaxDomains = 20;

export function parseDomainList(value: unknown) {
  return String(value ?? '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const formSchema = createInsertSchema(autoModSetting, {
  enabled: (schema) => schema.default(false),
  enableInviteUrlFilter: (schema) => schema.default(false),
  enableTokenFilter: (schema) => schema.default(false),
  enableDomainFilter: (schema) => schema.default(false),
  enableLog: (schema) => schema.default(false),
  domainList: () =>
    z
      .preprocess(
        parseDomainList,
        z
          .array(z.string())
          .max(MaxDomains, `ドメインは最大${MaxDomains}個まで設定できます。`)
          .refine(
            (v) => v.every((domain) => domainRegex.test(domain)),
            '無効なドメインが含まれています。',
          )
          .refine((v) => new Set(v).size === v.length, '重複した値が含まれています。'),
      )
      .default([]),
  ignoreChannels: () =>
    snowflakeArraySchema.max(50, 'チャンネルは最大50個まで設定できます。').default([]),
  ignoreRoles: () => snowflakeArraySchema.max(50, 'ロールは最大50個まで設定できます。').default([]),
  logChannel: (schema) => schema.regex(SnowflakeRegex, '無効なIDです。').nullable().default(null),
})
  .omit({ guildId: true, createdAt: true, updatedAt: true })
  .superRefine((v, ctx) => {
    if (v.enabled && v.enableLog && !v.logChannel) {
      ctx.addIssue({
        code: 'custom',
        message: 'チャンネルが設定されていません。',
        path: ['logChannel'],
      });
    }
  });
