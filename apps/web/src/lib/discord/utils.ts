/** 特定の権限が含まれていれば`true`を返す */
export function hasPermission(permissions: string, permission: bigint) {
  return (BigInt(permissions) & permission) === permission;
}
type AnyComponent = { type: number; components?: AnyComponent[]; accessory?: { type: number } };
/** コンポーネントのネストを含めた合計数を返す */
export function countTotalComponents(components: AnyComponent[]): number {
  return components.reduce((total, component) => {
    let count = 1;
    if (component.components) count += countTotalComponents(component.components);
    if (component.accessory) count += 1;
    return total + count;
  }, 0);
}
