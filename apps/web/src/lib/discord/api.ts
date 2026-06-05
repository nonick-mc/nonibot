import 'server-only';

import { type CreateFetchOption, createFetch } from '@better-fetch/fetch';
import {
  type APIGuild,
  PermissionFlagsBits,
  type RESTAPIPartialCurrentUserGuild,
  type RESTGetAPICurrentUserGuildsQuery,
  type RESTGetAPIGuildMemberResult,
  type RESTGetAPIGuildQuery,
  type RESTGetAPIGuildRolesResult,
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

/** @see https://discord.com/developers/docs/resources/guild#get-guild */
export function getGuild(
  guildId: string,
  query?: RESTGetAPIGuildQuery,
  next?: NextFetchRequestConfig,
) {
  return botFetch<APIGuild, false>(Routes.guild(guildId), {
    query,
    next,
    throw: true,
  });
}

/** @see https://discord.com/developers/docs/resources/guild#get-guild-member */
export function getGuildMember(
  guildId: string,
  userId: string | '@me',
  next?: NextFetchRequestConfig,
) {
  return botFetch<RESTGetAPIGuildMemberResult, false>(Routes.guildMember(guildId, userId), {
    next,
    throw: true,
  });
}

/** @see https://discord.com/developers/docs/resources/guild#get-guild-roles */
export function getRoles(guildId: string, next?: NextFetchRequestConfig) {
  return botFetch<RESTGetAPIGuildRolesResult, false>(Routes.guildRoles(guildId), {
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

/** ユーザーのサーバー内での権限を取得 **/
export const getGuildMemberPermissions = cache(async (guildId: string, userId: string) => {
  const [member, roles] = await Promise.all([getGuildMember(guildId, userId), getRoles(guildId)]);

  const currentMemberRoles = roles.filter(
    (role) => member.roles.includes(role.id) || role.id === guildId,
  );

  let permissions = BigInt(0);
  for (const role of currentMemberRoles) {
    permissions |= BigInt(role.permissions);
  }

  return permissions.toString();
});
