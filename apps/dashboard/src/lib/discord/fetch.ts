import 'server-only';

import { type CreateFetchOption, createFetch } from '@better-fetch/fetch';
import { headers } from 'next/headers';
import { auth } from '../auth';
import { defaultRetryOption } from '../better-fetch';
import { DiscordEndPoints } from './constants';

const defaultFetchOptions: CreateFetchOption = {
  baseURL: DiscordEndPoints.API,
  retry: defaultRetryOption,
};

export const discordFetch = createFetch(defaultFetchOptions);

export const discordBotUserFetch = createFetch({
  headers: { authorization: `Bot ${process.env.DISCORD_TOKEN}` },
  ...defaultFetchOptions,
});

export const discordOAuth2UserFetch = createFetch({
  auth: {
    type: 'Bearer',
    token: async () => {
      const requestHeaders = await headers();
      const accounts = await auth.api.listUserAccounts({ headers: requestHeaders });
      const discord = accounts.find((account) => account.providerId === 'discord');
      if (!discord) throw new Error('Discord account not linked');

      const { accessToken } = await auth.api.getAccessToken({
        body: { accountId: discord.id },
        headers: requestHeaders,
      });
      return accessToken;
    },
  },
  ...defaultFetchOptions,
});
