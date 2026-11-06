import { memberLevel } from '@repo/database';
import { Events } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';

export const signal = new Signal(Events.GuildMemberRemove);

// サーバーを脱退(退出・キック・BAN)したメンバーのレベルデータを削除
execute(signal, async (member) => {
  await db
    .delete(memberLevel)
    .where(and(eq(memberLevel.guildId, member.guild.id), eq(memberLevel.userId, member.id)));
});
