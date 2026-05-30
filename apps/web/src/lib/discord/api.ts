import 'server-only';

import { type CreateFetchOption, createFetch } from '@better-fetch/fetch';
import {
  PermissionFlagsBits,
  type RESTAPIPartialCurrentUserGuild,
  RouteBases,
  Routes,
} from 'discord-api-types/v10';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '../auth';
import { defaultRetryOption } from '../better-fetch';
import { db } from '../db';
import { hasPermission } from './utils';

const defaultFetchOptions: CreateFetchOption = {
  baseURL: RouteBases.api,
  retry: defaultRetryOption,
};

const botFetch = createFetch({
  headers: { authorization: `Bot ${process.env.DISCORD_TOKEN}` },
  ...defaultFetchOptions,
});

const oauth2UserFetch = createFetch({
  auth: {
    type: 'Bearer',
    token: async () => {
      const { accessToken } = await auth.api.getAccessToken({
        body: { providerId: 'discord' },
        headers: await headers(),
      });
      return accessToken;
    },
  },
  onError: (context) => {
    if (context.error.status === 401) redirect('/login');
  },
  ...defaultFetchOptions,
});

/** https://discord.com/developers/docs/resources/user#get-current-user-guilds */
export async function getUserGuilds(next?: NextFetchRequestConfig) {
  return await oauth2UserFetch<RESTAPIPartialCurrentUserGuild[], false>(Routes.userGuilds(), {
    next,
    throw: true,
  });
}

/** ログイン中のユーザーがどちらも参加しているサーバーを取得 **/
export const getMutualGuilds = cache(async () => {
  const userGuilds = await getUserGuilds();
  const mutualGuilds = await db.query.guild.findMany({
    where: (guild, { inArray }) =>
      inArray(
        guild.id,
        userGuilds.map((v) => v.id),
      ),
    columns: { id: true },
  });

  const mutualGuildIds = new Set(mutualGuilds.map((guild) => guild.id));
  return userGuilds.filter((guild) => mutualGuildIds.has(guild.id));
});

/** ログイン中のユーザーが「サーバーを管理」権限を持つ相互サーバーを取得 **/
export const getManageableGuilds = cache(async () => {
  const guilds = await getMutualGuilds();
  return guilds.filter((guild) =>
    hasPermission(guild.permissions, PermissionFlagsBits.ManageGuild),
  );
});
