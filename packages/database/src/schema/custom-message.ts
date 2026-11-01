import type { APIMessageTopLevelComponent } from 'discord-api-types/v10';
import { jsonb, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../utils';
import { guild } from './guild';

export const customMessage = pgTable(
  'custom_message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id')
      .notNull()
      .references(() => guild.id, { onDelete: 'cascade' }),
    channelId: text('channel_id').notNull(),
    messageId: text('message_id').notNull(),
    name: text('name').notNull(),
    components: jsonb('components').array().$type<APIMessageTopLevelComponent[]>().notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.guildId, t.messageId)],
);
