import { webhook } from '@repo/database';
import {
  ChannelType,
  DiscordAPIError,
  type Guild,
  type MessageCreateOptions,
  RESTJSONErrorCodes,
  WebhookClient,
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';

async function createWebhook(guild: Guild, channelId: string) {
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (channel?.type !== ChannelType.GuildText) return null;

  const created = await channel
    .createWebhook({
      name: guild.client.user.username,
      avatar: guild.client.user.displayAvatarURL(),
    })
    .catch(() => null);
  if (!created) return null;

  await db
    .insert(webhook)
    .values({
      channelId,
      guildId: guild.id,
      webhookId: created.id,
      webhookToken: created.token,
    })
    .onConflictDoUpdate({
      target: webhook.channelId,
      set: { guildId: guild.id, webhookId: created.id, webhookToken: created.token },
    });

  return { id: created.id, token: created.token };
}

async function getOrCreateWebhook(guild: Guild, channelId: string) {
  const row = await db.query.webhook.findFirst({
    where: (w, { eq }) => eq(w.channelId, channelId),
  });
  if (row) return { id: row.webhookId, token: row.webhookToken };

  return createWebhook(guild, channelId);
}

// Webhookが外部から削除された場合、DBの記録を破棄して作り直してから一度だけ再送する
export async function sendViaWebhook(
  guild: Guild,
  channelId: string,
  payload: MessageCreateOptions,
) {
  const hook = await getOrCreateWebhook(guild, channelId);
  if (!hook) return;

  const client = new WebhookClient(hook);
  try {
    await client.send(payload);
  } catch (err) {
    if (!(err instanceof DiscordAPIError) || err.code !== RESTJSONErrorCodes.UnknownWebhook) return;

    await db.delete(webhook).where(eq(webhook.channelId, channelId));
    const recreated = await createWebhook(guild, channelId);
    if (!recreated) return;

    await new WebhookClient(recreated).send(payload).catch(() => null);
  }
}
