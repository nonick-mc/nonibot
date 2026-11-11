/** レベルlvから次のレベルに上がるために必要な経験値 */
export function getNeedXP(lv: number) {
  return 5 * lv ** 2 + 50 * lv + 100;
}
