import type { APIMessageTopLevelComponent } from 'discord-api-types/v10';
import { jsonb, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../utils';
import { guild } from './guild';

export type CustomActionStep =
  | { type: 'role-toggle'; config: { roleId: string } }
  | {
      type: 'reply-message';
      config: { components: APIMessageTopLevelComponent[]; ephemeral: boolean };
    };

export const customAction = pgTable(
  'custom_action',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id')
      .notNull()
      .references(() => guild.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    steps: jsonb('steps').array().$type<CustomActionStep[]>().notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.guildId, t.name)],
);
