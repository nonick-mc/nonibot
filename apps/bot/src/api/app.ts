import { createHash, timingSafeEqual } from 'node:crypto';
import type { InternalApiError } from '@repo/shared';
import { SnowflakeRegex } from '@repo/shared';
import { type Client, DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
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
    return c.json(guild.channels.cache.map(serializeChannel));
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

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'Internal Server Error' } satisfies InternalApiError, 500);
  });

  return app;
}
