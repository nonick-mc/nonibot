import { index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { guild } from './guild';

export const memberLevel = pgTable(
  'member_level',
  {
    guildId: text('guild_id')
      .references(() => guild.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id').notNull(),
    lv: integer('lv').notNull(),
    xp: integer('xp').notNull(),
    lastGainedAt: timestamp('last_gained_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.guildId, t.userId] }),
    // サーバー内の順位計算用
    index('member_level_guild_id_rank_idx').on(t.guildId, t.lv.desc(), t.xp.desc()),
  ],
);
