'use server';

import { BetterFetchError } from '@better-fetch/fetch';
import { auditLog, levelSetting, memberLevel } from '@repo/database';
import { desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { searchGuildMembers } from '@/lib/discord/api';
import rateLimit from '@/lib/rate-limit';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { formSchema, type LevelData, levelDataSchema } from './schema';

// Postgresのパラメータ数の上限(65535)を超えないように分割する
const ChunkSize = 1000;
const chunk = <T>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / ChunkSize) }, (_, i) =>
    items.slice(i * ChunkSize, (i + 1) * ChunkSize),
  );

// インポートはサーバーごとに10分に3回までにする
const importLimiter = rateLimit({ interval: 10 * 60 * 1000 });

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.levelSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    const [after] = await db
      .insert(levelSetting)
      .values({ guildId, ...parsedInput })
      .onConflictDoUpdate({ target: levelSetting.guildId, set: parsedInput })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'level',
      before,
      after,
    });

    revalidatePath('/');
  });

export const exportMemberLevelsAction = guildActionClient.action(
  async ({ bindArgsParsedInputs: [guildId] }): Promise<LevelData> => {
    const data = await db
      .select({ userId: memberLevel.userId, lv: memberLevel.lv, xp: memberLevel.xp })
      .from(memberLevel)
      .where(eq(memberLevel.guildId, guildId))
      .orderBy(desc(memberLevel.lv), desc(memberLevel.xp));
    return { guildId, data };
  },
);

export const importMemberLevelsAction = guildActionClient
  .inputSchema(levelDataSchema)
  .action(async ({ parsedInput: file, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    await importLimiter.check(3, guildId).catch(() => {
      throw new ActionClientError('インポートは10分に3回まで実行できます。');
    });

    // データを変更する前に失敗したときは、回数を戻して再実行できるようにする
    let rows: LevelData['data'];
    let changed: number;
    try {
      // 退出したメンバーのレコードはBotが削除するため、レコードがあるメンバーは在籍しているとみなす
      const existingIds = new Set(
        (
          await db
            .select({ userId: memberLevel.userId })
            .from(memberLevel)
            .where(eq(memberLevel.guildId, guildId))
        ).map((v) => v.userId),
      );
      const unknownIds = file.data.map((v) => v.userId).filter((id) => !existingIds.has(id));
      const memberIds = new Set([
        ...existingIds,
        ...(unknownIds.length
          ? await searchGuildMembers(guildId, unknownIds).catch((error) => {
              if (error instanceof BetterFetchError && error.status === 429) {
                const { retry_after } = error.error as { retry_after: number };
                throw new ActionClientError(
                  `メンバー情報の取得が制限されています。${Math.ceil(retry_after)}秒後に再度お試しください。`,
                );
              }
              throw error;
            })
          : []),
      ]);
      rows = file.data.filter((v) => memberIds.has(v.userId));

      // ファイルに含まれないメンバーのレコードはそのまま残す
      changed = await db.transaction(async (tx) => {
        let count = 0;

        for (const values of chunk(rows)) {
          const upserted = await tx
            .insert(memberLevel)
            .values(values.map((v) => ({ ...v, guildId, lastGainedAt: new Date(0) })))
            .onConflictDoUpdate({
              target: [memberLevel.guildId, memberLevel.userId],
              set: { lv: sql`excluded.lv`, xp: sql`excluded.xp` },
              setWhere: sql`(${memberLevel.lv}, ${memberLevel.xp}) is distinct from (excluded.lv, excluded.xp)`,
            })
            .returning({ userId: memberLevel.userId });
          count += upserted.length;
        }

        return count;
      });
    } catch (error) {
      importLimiter.release(guildId);
      throw error;
    }

    if (changed > 0) {
      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'member_level',
        actionType: 'import_member_level',
        after: changed,
      });
    }

    revalidatePath('/');
    return { changed, excluded: file.data.length - rows.length };
  });

export const resetMemberLevelsAction = guildActionClient.action(
  async ({ bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const deleted = await db
      .delete(memberLevel)
      .where(eq(memberLevel.guildId, guildId))
      .returning({ userId: memberLevel.userId });

    if (deleted.length > 0) {
      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'member_level',
        actionType: 'reset_member_level',
        after: deleted.length,
      });
    }

    revalidatePath('/');
    return { changed: deleted.length };
  },
);
