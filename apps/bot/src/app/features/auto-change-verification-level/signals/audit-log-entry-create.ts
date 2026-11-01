import { autoChangeVerifyLevelSetting } from '@repo/database';
import { AuditLogEvent, Events } from 'discord.js';
import { eq } from 'drizzle-orm';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { isActivePeriod } from '../period';

export const signal = new Signal(Events.GuildAuditLogEntryCreate);

// 期間内に認証レベルが手動で変更された場合、defaultLevelを更新
execute(signal, async (auditLogEntry, guild) => {
  if (auditLogEntry.action !== AuditLogEvent.GuildUpdate) return;
  // Bot自身による変更は自動認証レベル変更によるものと判断し除外
  if (auditLogEntry.executorId === guild.client.user.id) return;

  const change = auditLogEntry.changes.find((c) => c.key === 'verification_level');
  if (typeof change?.new !== 'number') return;

  const setting = await db.query.autoChangeVerifyLevelSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guild.id),
  });
  if (!setting?.enabled || !isActivePeriod(setting)) return;
  if (change.new === setting.level) return;

  await db
    .update(autoChangeVerifyLevelSetting)
    .set({ defaultLevel: change.new })
    .where(eq(autoChangeVerifyLevelSetting.guildId, guild.id));
});
