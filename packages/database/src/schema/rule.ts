import type { APIMessageTopLevelComponent } from 'discord-api-types/v10';
import { boolean, integer, jsonb, pgEnum, pgSchema, primaryKey, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../utils';
import { guild } from './guild';

export const ruleSchema = pgSchema('public_rule');

const guildId = text('guild_id')
  .notNull()
  .references(() => guild.id, { onDelete: 'cascade' });

export const threadStateEnum = pgEnum('thread_state', [
  'open',
  'archived',
  'locked',
  'archived_locked',
]);

export const autoCreateThreadRule = ruleSchema.table(
  'auto_create_thread',
  {
    guildId,
    enabled: boolean('enabled').notNull().default(true),
    channelId: text('channel_id').notNull(),
    threadName: text('thread_name').notNull(),
    autoArchiveDuration: integer('auto_archive_duration').notNull(),
    initialThreadState: threadStateEnum('initial_thread_state').notNull().default('open'),
    ignoreRoles: text('ignore_roles').array().notNull(),
    ignoreBot: boolean('ignore_bot').notNull(),
    messageEnabled: boolean('message_enabled').notNull().default(false),
    messageComponents: jsonb('message_components')
      .array()
      .$type<APIMessageTopLevelComponent[]>()
      .notNull()
      .default([]),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.guildId, table.channelId] })],
);
