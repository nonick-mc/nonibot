import { auditLog } from '@repo/database';
import { AuditLogRetentionDays } from '@repo/shared/constants';
import { Events } from 'discord.js';
import { lt } from 'drizzle-orm';
import { schedule } from 'node-cron';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';

export const signal = new Signal(Events.ClientReady, { once: true });

execute(signal, () => {
  schedule(
    '0 0 * * *',
    async () => {
      try {
        const expireDate = new Date(Date.now() - AuditLogRetentionDays * 24 * 60 * 60 * 1000);
        await db.delete(auditLog).where(lt(auditLog.createdAt, expireDate));
      } catch (error) {
        console.error('監査ログの削除に失敗しました', error);
      }
    },
    { timezone: 'Asia/Tokyo' },
  );
});
