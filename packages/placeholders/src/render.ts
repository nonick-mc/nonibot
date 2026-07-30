import parseTemplate from 'json-templates';

/**
 * `{{key}}` 形式のプレースホルダーを含むJSON値を実際の値に置き換える。
 */
export function renderPlaceholders<T>(source: T, params: Record<string, unknown>): T {
  const template = parseTemplate(source as unknown as string | object);
  return template(params) as unknown as T;
}
