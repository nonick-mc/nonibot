import 'dotenv/config';

import {
  AllowedMentionsTypes,
  DiscordAPIError,
  DiscordjsError,
  GatewayIntentBits,
  HTTPError,
  Partials,
  RateLimitError,
} from 'discord.js';
import { Client, dirname, load } from 'sunar';
import { assertApiEnv } from './api';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],
  allowedMentions: {
    parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.User],
  },
});

const isDiscordError = (e: unknown) =>
  e instanceof DiscordAPIError ||
  e instanceof DiscordjsError ||
  e instanceof HTTPError ||
  e instanceof RateLimitError;

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
  if (!isDiscordError(error)) process.exit(1);
});

const start = async () => {
  assertApiEnv();

  const base = dirname(import.meta.url);
  const baseDir = base.split('/').at(-1);

  await load(`${baseDir}/app/**/*.{mjs,ts}`);
  client.login();
};

start();
