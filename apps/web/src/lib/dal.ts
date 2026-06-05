import { cache } from 'react';
import 'server-only';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { db } from './db';
import { getGuild, getGuildMemberPermissions } from './discord/api';
import { hasPermission } from './discord/utils';

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
  try {
    const session = await getCachedSession();
    if (!session) return false;

    const [guild, permissions, hasGuildSetting] = await Promise.all([
      getGuild(guildId),
      getGuildMemberPermissions(guildId, session.user.discordUserId),
      db.query.guild.findFirst({ where: (guild, { eq }) => eq(guild.id, guildId) }),
    ]);

    if (!hasGuildSetting) return false;
    if (guild.owner_id === session.user.discordUserId) return true;

    return (
      hasPermission(permissions, PermissionFlagsBits.ManageGuild) ||
      hasPermission(permissions, PermissionFlagsBits.Administrator)
    );
  } catch {
    return false;
  }
});

export const verifyDashboardAccessPermission = cache(async (guildId: string) => {
  const isAccessible = await canAccessDashboard(guildId);
  if (!isAccessible) redirect('/dashboard');
});
