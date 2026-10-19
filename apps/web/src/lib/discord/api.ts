import 'server-only';

import { createFetch } from '@better-fetch/fetch';
import type {
  InternalApiChannel,
  InternalApiEmoji,
  InternalApiGuild,
  InternalApiMember,
  InternalApiRole,
} from '@repo/shared';
import {
  PermissionFlagsBits,
  type RESTAPIPartialCurrentUserGuild,
  type RESTGetAPICurrentUserGuildsQuery,
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  RouteBases,
  Routes,
} from 'discord-api-types/v10';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '../auth';
import { fetchWithRetryAfter } from '../better-fetch';
import { db } from '../db';
import { hasPermission } from './utils';

const internalFetch = createFetch({
  baseURL: process.env.INTERNAL_API_URL,
  auth: { type: 'Bearer', token: process.env.INTERNAL_API_SECRET },
  cache: 'no-store',
  throw: true,
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
  baseURL: RouteBases.api,
  customFetchImpl: fetchWithRetryAfter,
});

/** @see https://discord.com/developers/docs/resources/user#get-current-user-guilds */
export async function getUserGuilds(
  query?: RESTGetAPICurrentUserGuildsQuery,
  next?: NextFetchRequestConfig,
) {
  return oauth2UserFetch<RESTAPIPartialCurrentUserGuild[], false>(Routes.userGuilds(), {
    query,
    next,
    throw: true,
  });
}

export function getGuild(guildId: string) {
  return internalFetch<InternalApiGuild, false>(`/guilds/${encodeURIComponent(guildId)}`);
}
export const getGuildMember = cache((guildId: string, userId: string) => {
  return internalFetch<InternalApiMember, false>(
    `/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`,
  );
});
export function getRoles(guildId: string) {
  return internalFetch<InternalApiRole[], false>(`/guilds/${encodeURIComponent(guildId)}/roles`);
}
export function getChannels(guildId: string) {
  return internalFetch<InternalApiChannel[], false>(
    `/guilds/${encodeURIComponent(guildId)}/channels`,
  );
}
export function getGuildEmojis(guildId: string) {
  return internalFetch<InternalApiEmoji[], false>(`/guilds/${encodeURIComponent(guildId)}/emojis`);
}

/** Botとしてチャンネルにメッセージを送信 **/
export function createChannelMessage(channelId: string, body: RESTPostAPIChannelMessageJSONBody) {
  return internalFetch<RESTPostAPIChannelMessageResult, false>(
    `/channels/${encodeURIComponent(channelId)}/messages`,
    { method: 'POST', body },
  );
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
