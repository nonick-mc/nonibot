import { report } from '@repo/database';
import { type ContainerBuilder, type Guild, MessageFlags } from 'discord.js';
import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';

export function findReportsByMessage(
  guildId: string,
  targetChannelId: string,
  targetMessageId: string,
) {
  return db.query.report.findMany({
    where: (r, { eq, and }) =>
      and(
        eq(r.guildId, guildId),
        eq(r.targetChannelId, targetChannelId),
        eq(r.targetMessageId, targetMessageId),
      ),
  });
}

export function findReportsByUser(guildId: string, targetUserId: string) {
  return db.query.report.findMany({
    where: (r, { eq, and }) => and(eq(r.guildId, guildId), eq(r.targetUserId, targetUserId)),
  });
}

export function findReportByThreadId(threadId: string) {
  return db.query.report.findFirst({
    where: (r, { eq }) => eq(r.threadId, threadId),
  });
}

export async function deleteReport(id: string) {
  await db.delete(report).where(eq(report.id, id));
}

export async function sendReportLog(
  guild: Guild,
  reports: { id: string; threadId: string }[],
  components: ContainerBuilder[],
) {
  for (const r of reports) {
    const thread = await guild.channels.fetch(r.threadId).catch(() => null);

    if (!thread?.isThread()) {
      await deleteReport(r.id);
      continue;
    }

    await thread
      .send({
        components,
        flags: [MessageFlags.IsComponentsV2],
        allowedMentions: { parse: [] },
      })
      .catch(() => null);
  }
}
