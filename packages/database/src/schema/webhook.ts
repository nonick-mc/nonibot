import { pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../utils';
import { guild } from './guild';

// チャンネルにつき1つのWebhookを使い回すため、複数のログ種別が同じチャンネルを指していても共有できる
export const webhook = pgTable('webhook', {
  channelId: text('channel_id').primaryKey(),
  guildId: text('guild_id')
    .notNull()
    .references(() => guild.id, { onDelete: 'cascade' }),
  webhookId: text('webhook_id').notNull(),
  webhookToken: text('webhook_token').notNull(),
  ...timestamps,
});
