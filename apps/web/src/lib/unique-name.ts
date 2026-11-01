/** 既に使われている名前と重複しない、`名前 2`のような連番付きの名前を返す */
export function uniqueName(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
