/** 特定の権限が含まれていれば`true`を返す */
export function hasPermission(permissions: string, permission: bigint) {
  return (BigInt(permissions) & permission) === permission;
}
