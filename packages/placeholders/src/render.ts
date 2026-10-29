/**
 * `{{key}}` 形式のプレースホルダーを含むJSON値を実際の値に置き換える。
 * `params` に存在しないキーはそのまま残す。
 */
export function renderPlaceholders<T>(source: T, params: Record<string, unknown>): T {
  if (typeof source === 'string') {
    return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
      key in params ? String(params[key]) : match,
    ) as T;
  }
  if (Array.isArray(source)) {
    return source.map((v) => renderPlaceholders(v, params)) as T;
  }
  if (source && typeof source === 'object') {
    return Object.fromEntries(
      Object.entries(source).map(([k, v]) => [k, renderPlaceholders(v, params)]),
    ) as T;
  }
  return source;
}
