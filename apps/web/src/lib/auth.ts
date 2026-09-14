import 'server-only';

import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { OAuth2Scopes } from 'discord-api-types/v10';
import { db } from '@/lib/db';

export const auth = betterAuth({
  appName: 'nonibot',
  baseURL: process.env.BETTER_AUTH_URL as string,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  user: {
    additionalFields: {
      globalName: {
        type: 'string',
        required: false,
        defaultValue: null,
      },
      discordUserId: {
        type: 'string',
        required: true,
      },
    },
  },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      scope: [OAuth2Scopes.Identify, OAuth2Scopes.Guilds],
      prompt: 'consent',
      disableDefaultScope: true,
      overrideUserInfoOnSignIn: true,
      mapProfileToUser: (profile) => {
        return {
          name: profile.username,
          globalName: profile.global_name,
          discordUserId: profile.id,
          email: `${profile.id}@discord.local`,
          emailVerified: false,
        };
      },
    },
  },
  advanced: {
    ipAddress: {
      // For Cloudflare
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
    },
  },
  experimental: {
    joins: true,
  },
  plugins: [dash()],
});
