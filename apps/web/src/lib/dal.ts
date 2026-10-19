import { BetterFetchError } from '@better-fetch/fetch';
import { cache } from 'react';
import 'server-only';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { db } from './db';
import { getGuild, getGuildMember } from './discord/api';
import { hasPermission } from './discord/utils';
import { SnowflakeRegex } from './discord/zod';

export const getCachedSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export const verifySession = cache(async () => {
  const session = await getCachedSession();
  if (!session) redirect('/login');
});

export const canAccessDashboard = cache(async (guildId: string) => {
  if (!SnowflakeRegex.test(guildId)) return false;

  try {
    const session = await getCachedSession();
    if (!session) return false;

    const [guild, member, hasGuildSetting] = await Promise.all([
      getGuild(guildId),
      getGuildMember(guildId, session.user.discordUserId),
      db.query.guild.findFirst({ where: (guild, { eq }) => eq(guild.id, guildId) }),
    ]);

    if (!hasGuildSetting) return false;
    if (guild.owner_id === session.user.discordUserId) return true;

    return (
      hasPermission(member.permissions, PermissionFlagsBits.ManageGuild) ||
      hasPermission(member.permissions, PermissionFlagsBits.Administrator)
    );
  } catch (error) {
    if (error instanceof BetterFetchError && error.status === 404) return false;
    throw error;
  }
});

export const verifyDashboardAccessPermission = cache(async (guildId: string) => {
  const isAccessible = await canAccessDashboard(guildId);
  if (!isAccessible) redirect('/dashboard');
});
