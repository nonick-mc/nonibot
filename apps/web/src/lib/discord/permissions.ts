import {
  type APIOverwrite,
  type APIRole,
  OverwriteType,
  PermissionFlagsBits,
} from 'discord-api-types/v10';

/** ロールのみから算出したサーバー全体の権限 (`@everyone`を含む) */
export function computeBasePermissions(guildId: string, memberRoleIds: string[], roles: APIRole[]) {
  let permissions = BigInt(0);
  for (const role of roles) {
    if (role.id === guildId || memberRoleIds.includes(role.id))
      permissions |= BigInt(role.permissions);
  }
  return permissions;
}

/**
 * チャンネルの上書きを適用した権限を算出
 * @see https://discord.com/developers/docs/topics/permissions#permission-overwrites
 */
export function computeChannelPermissions(params: {
  guildId: string;
  memberId: string;
  memberRoleIds: string[];
  roles: APIRole[];
  overwrites: APIOverwrite[];
}) {
  const { guildId, memberId, memberRoleIds, roles, overwrites } = params;
  let permissions = computeBasePermissions(guildId, memberRoleIds, roles);
  if (permissions & PermissionFlagsBits.Administrator) return (~BigInt(0)).toString();

  const apply = (o?: APIOverwrite) => {
    if (o) permissions = (permissions & ~BigInt(o.deny)) | BigInt(o.allow);
  };

  apply(overwrites.find((o) => o.type === OverwriteType.Role && o.id === guildId));

  let deny = BigInt(0);
  let allow = BigInt(0);
  for (const o of overwrites) {
    if (o.type === OverwriteType.Role && memberRoleIds.includes(o.id)) {
      deny |= BigInt(o.deny);
      allow |= BigInt(o.allow);
    }
  }
  permissions = (permissions & ~deny) | allow;

  apply(overwrites.find((o) => o.type === OverwriteType.Member && o.id === memberId));
  return permissions.toString();
}
