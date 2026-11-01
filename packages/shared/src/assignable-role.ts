import type { InternalApiRole } from './types';

export type AssignableRoleRules = {
  guildId: string;
  botHighestPosition: number;
  userHighestPosition: number | null;
};

/** Botが付与でき、操作する人より低い位置にあるロールか判定する */
export function isAssignableRole(
  role: InternalApiRole,
  { guildId, botHighestPosition, userHighestPosition }: AssignableRoleRules,
) {
  return (
    !role.managed &&
    role.id !== guildId &&
    role.position < botHighestPosition &&
    (userHighestPosition === null || role.position < userHighestPosition)
  );
}
