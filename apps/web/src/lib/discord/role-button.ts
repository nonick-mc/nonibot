import 'server-only';

import type { RoleButtonRules } from '@repo/shared';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { getCachedSession } from '../dal';
import { getGuild, getGuildMember, getRoles } from './api';
import { hasPermission } from './utils';

/**
 * ロールボタンに設定できるロールの制限を取得する。
 * オーナーと管理者は、Botの階層の制限だけを受ける。
 */
export async function getRoleButtonRules(
  guildId: string,
  discordUserId: string,
): Promise<RoleButtonRules> {
  const [guild, member, roles] = await Promise.all([
    getGuild(guildId),
    getGuildMember(guildId, discordUserId),
    getRoles(guildId),
  ]);

  const isUnrestricted =
    guild.owner_id === discordUserId ||
    hasPermission(member.permissions, PermissionFlagsBits.Administrator);

  return {
    guildId,
    botHighestPosition: guild.bot_highest_role_position,
    userHighestPosition: isUnrestricted
      ? null
      : Math.max(0, ...roles.filter((r) => member.roles.includes(r.id)).map((r) => r.position)),
  };
}

/** ログイン中のユーザーに対する、ロールボタンの制限を取得する */
export async function getCurrentRoleButtonRules(guildId: string) {
  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');
  return getRoleButtonRules(guildId, session.user.discordUserId);
}
