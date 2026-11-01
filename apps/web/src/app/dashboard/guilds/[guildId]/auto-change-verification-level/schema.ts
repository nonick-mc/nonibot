import { autoChangeVerifyLevelSetting } from '@repo/database';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { snowflakeIdSchema } from '@/lib/discord/zod';

z.config(z.locales.ja());

const hourSchema = (label: string, defaultValue: number) => {
  const message = `${label}: 0〜23の数値で入力してください`;
  return z
    .number({ error: message })
    .int(message)
    .min(0, message)
    .max(23, message)
    .default(defaultValue);
};

export const formSchema = createInsertSchema(autoChangeVerifyLevelSetting, {
  enabled: (schema) => schema.default(false),
  startHour: () => hourSchema('開始時刻', 0),
  endHour: () => hourSchema('終了時刻', 6),
  level: (schema) => schema.int().min(0).max(4).default(4),
  enableLog: (schema) => schema.default(false),
  logChannel: () => snowflakeIdSchema.default(null),
})
  .omit({ guildId: true, defaultLevel: true, createdAt: true, updatedAt: true })
  .superRefine((v, ctx) => {
    if (v.startHour === v.endHour) {
      // 開始・終了時間は1つのフィールドとして表示するため、エラーはstartHourのみ定義する
      ctx.addIssue({
        code: 'custom',
        message: '開始時間と終了時間を同じ値にすることはできません。',
        path: ['startHour'],
      });
    }
    if (v.enabled && v.enableLog && !v.logChannel) {
      ctx.addIssue({
        code: 'custom',
        message: 'チャンネルが設定されていません。',
        path: ['logChannel'],
      });
    }
  });
