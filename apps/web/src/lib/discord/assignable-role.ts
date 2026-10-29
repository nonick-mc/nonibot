import 'server-only';

import type { AssignableRoleRules } from '@repo/shared';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { getCachedSession } from '../dal';
import { getGuild, getGuildMember, getRoles } from './api';
import { hasPermission } from './utils';

/**
 * 付与・解除できるロールの制限を取得する。
 * 「ロールの管理」権限がなければ`null`を返す。
 * オーナーと管理者は、Botの階層の制限だけを受ける。
 */
export async function getAssignableRoleRules(
  guildId: string,
  discordUserId: string,
): Promise<AssignableRoleRules | null> {
  const [guild, member, roles] = await Promise.all([
    getGuild(guildId),
    getGuildMember(guildId, discordUserId),
    getRoles(guildId),
  ]);

  const isUnrestricted =
    guild.owner_id === discordUserId ||
    hasPermission(member.permissions, PermissionFlagsBits.Administrator);
  if (!isUnrestricted && !hasPermission(member.permissions, PermissionFlagsBits.ManageRoles)) {
    return null;
  }

  return {
    guildId,
    botHighestPosition: guild.bot_highest_role_position,
    userHighestPosition: isUnrestricted
      ? null
      : Math.max(0, ...roles.filter((r) => member.roles.includes(r.id)).map((r) => r.position)),
  };
}

/** ログイン中のユーザーに対する、ロール付与の制限を取得する */
export async function getCurrentAssignableRoleRules(guildId: string) {
  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');
  return getAssignableRoleRules(guildId, session.user.discordUserId);
}
