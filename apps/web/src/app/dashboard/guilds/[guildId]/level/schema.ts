import { levelSetting } from '@repo/database';
import { levelNotifyMessagePlaceholders } from '@repo/placeholders';
import { getNeedXP } from '@repo/shared';
import { ComponentType } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import {
  createMessageUserComponentsSchema,
  messageComponentsWithDefault,
  SnowflakeRegex,
  snowflakeArraySchema,
} from '@/lib/discord/zod';

z.config(z.locales.ja());

export const roleRewardSchema = z.object({
  level: z
    .int('レベルを入力してください。')
    .min(1, 'レベルは1以上10000以下である必要があります。')
    .max(10000, 'レベルは1以上10000以下である必要があります。'),
  roleId: z.string().regex(SnowflakeRegex, 'ロールを選択してください。'),
  mode: z.enum(['add', 'replace']),
});

export const formSchema = createInsertSchema(levelSetting, {
  enabled: (schema) => schema.default(false),
  notifyMode: (schema) => schema.default('sameChannel'),
  notifyChannel: (schema) =>
    schema.regex(SnowflakeRegex, '無効なIDです。').nullable().default(null),
  notifyMessageComponents: messageComponentsWithDefault(
    createMessageUserComponentsSchema(levelNotifyMessagePlaceholders),
    [
      {
        type: ComponentType.TextDisplay,
        content: '**おめでとう!** {{user}} が**レベル{{level}}**になりました!',
      },
    ],
  ),
  ignoreChannels: () =>
    snowflakeArraySchema.max(50, 'チャンネルは最大50個まで設定できます。').default([]),
  ignoreRoles: () => snowflakeArraySchema.max(20, 'ロールは最大20個まで設定できます。').default([]),
  roleRewards: () =>
    z
      .array(roleRewardSchema)
      .max(20, 'ロール報酬は最大20個まで設定できます。')
      // 並べ替え(transform)より前に検証し、エラーの位置を入力欄の並びと一致させる
      .superRefine((rewards, ctx) => {
        rewards.forEach((reward, i) => {
          if (rewards.findIndex((r) => r.level === reward.level) !== i) {
            ctx.addIssue({
              code: 'custom',
              message: '同じレベルに複数の報酬は設定できません。',
              path: [i, 'level'],
            });
          }
          if (rewards.findIndex((r) => r.roleId === reward.roleId) !== i) {
            ctx.addIssue({
              code: 'custom',
              message: '同じロールは複数の報酬に設定できません。',
              path: [i, 'roleId'],
            });
          }
        });
      })
      .transform((rewards) => rewards.toSorted((a, b) => a.level - b.level))
      .default([]),
})
  .omit({ guildId: true, createdAt: true, updatedAt: true })
  .superRefine((v, ctx) => {
    if (v.enabled && v.notifyMode === 'fixedChannel' && !v.notifyChannel) {
      ctx.addIssue({
        code: 'custom',
        message: 'チャンネルが設定されていません。',
        path: ['notifyChannel'],
      });
    }
  });

const Int32Max = 2 ** 31 - 1;

/** インポート・エクスポートするレベルデータのJSON */
export const levelDataSchema = z.strictObject({
  guildId: z.string().regex(SnowflakeRegex, '無効なIDです').optional(),
  data: z
    .array(
      z
        .strictObject({
          userId: z.string().regex(SnowflakeRegex, '無効なIDです'),
          lv: z.int().min(0).max(Int32Max),
          xp: z.int().min(0).max(Int32Max),
        })
        .refine((v) => v.xp < getNeedXP(v.lv), {
          path: ['xp'],
          error: '経験値がレベルアップに必要な量以上です',
        }),
    )
    .superRefine((data, ctx) => {
      const seen = new Set<string>();
      data.forEach(({ userId }, i) => {
        if (seen.has(userId)) {
          ctx.addIssue({ code: 'custom', path: [i, 'userId'], message: '重複したIDです' });
        }
        seen.add(userId);
      });
    }),
});

export type LevelData = z.infer<typeof levelDataSchema>;
