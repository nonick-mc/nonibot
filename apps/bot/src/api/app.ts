import { createHash, timingSafeEqual } from 'node:crypto';
import type { InternalApiError } from '@repo/shared';
import { SnowflakeRegex } from '@repo/shared';
import {
  ChannelFlags,
  type Client,
  DiscordAPIError,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  Routes,
} from 'discord.js';
import { Hono } from 'hono';
import {
  serializeChannel,
  serializeEmoji,
  serializeGuild,
  serializeMember,
  serializeRole,
} from './serializers';

const sha256 = (value: string) => createHash('sha256').update(value).digest();

const notFound = { error: 'Not Found' } satisfies InternalApiError;

export function createApp(client: Client<true>, secret: string) {
  const expected = sha256(secret);
  const app = new Hono();

  app.use(async (c, next) => {
    const token = c.req.header('authorization')?.replace(/^Bearer /, '') ?? '';
    if (!timingSafeEqual(sha256(token), expected)) {
      return c.json({ error: 'Unauthorized' } satisfies InternalApiError, 401);
    }
    return next();
  });

  app.get('/guilds/:guildId', (c) => {
    const guild = client.guilds.cache.get(c.req.param('guildId'));
    if (!guild) return c.json(notFound, 404);
    return c.json(serializeGuild(guild));
  });

  app.get('/guilds/:guildId/roles', (c) => {
    const guild = client.guilds.cache.get(c.req.param('guildId'));
    if (!guild) return c.json(notFound, 404);
    return c.json(guild.roles.cache.map(serializeRole));
  });

  app.get('/guilds/:guildId/channels', (c) => {
    const guild = client.guilds.cache.get(c.req.param('guildId'));
    if (!guild) return c.json(notFound, 404);
    const me = guild.members.me;
    const channels = guild.channels.cache.filter(
      (ch) => !ch.flags.has(ChannelFlags.ChannelObfuscated),
    );
    return c.json(channels.map((ch) => serializeChannel(ch, me)));
  });

  app.get('/guilds/:guildId/emojis', (c) => {
    const guild = client.guilds.cache.get(c.req.param('guildId'));
    if (!guild) return c.json(notFound, 404);
    return c.json(guild.emojis.cache.map(serializeEmoji));
  });

  app.get('/guilds/:guildId/members/:userId', async (c) => {
    const userId = c.req.param('userId');
    const guild = client.guilds.cache.get(c.req.param('guildId'));
    if (!guild || !SnowflakeRegex.test(userId)) return c.json(notFound, 404);

    const member = await guild.members.fetch(userId).catch((error) => {
      if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownMember) {
        return null;
      }
      throw error;
    });
    if (!member) return c.json(notFound, 404);
    return c.json(serializeMember(member));
  });

  app.put('/guilds/:guildId/members/:userId/roles/:roleId', async (c) => {
    const { userId, roleId } = c.req.param();
    const guild = client.guilds.cache.get(c.req.param('guildId'));
    const role = guild?.roles.cache.get(roleId);
    if (!guild || !role || !SnowflakeRegex.test(userId)) return c.json(notFound, 404);

    const me = guild.members.me;
    if (
      !me?.permissions.has(PermissionFlagsBits.ManageRoles) ||
      role.managed ||
      role.comparePositionTo(me.roles.highest) >= 0
    ) {
      return c.json({ error: 'Forbidden' } satisfies InternalApiError, 403);
    }

    const member = await guild.members.fetch(userId).catch((error) => {
      if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownMember) {
        return null;
      }
      throw error;
    });
    if (!member) return c.json(notFound, 404);

    await member.roles.add(role, '認証');
    return c.body(null, 204);
  });

  app.post('/guilds/:guildId/channels/:channelId/messages', async (c) => {
    const channel = client.channels.cache.get(c.req.param('channelId'));
    if (
      !channel?.isSendable() ||
      channel.isDMBased() ||
      channel.guildId !== c.req.param('guildId')
    ) {
      return c.json(notFound, 404);
    }

    const body = await c.req.json().catch(() => null);
    if (typeof body !== 'object' || body === null) {
      return c.json({ error: 'Bad Request' } satisfies InternalApiError, 400);
    }

    const { components, flags, allowed_mentions } = body;
    const message = await client.rest.post(Routes.channelMessages(channel.id), {
      body: { components, flags, allowed_mentions },
    });
    return c.json(message as object);
  });

  app.onError((error, c) => {
    if (error instanceof DiscordAPIError && (error.status === 403 || error.status === 404)) {
      return c.json(
        { error: error.status === 403 ? 'Forbidden' : 'Not Found' } satisfies InternalApiError,
        error.status,
      );
    }
    console.error(error);
    return c.json({ error: 'Internal Server Error' } satisfies InternalApiError, 500);
  });

  return app;
}
