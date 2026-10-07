import { ComponentType } from 'discord-api-types/v10';

/** メッセージへの設置を許可するインタラクティブコンポーネント */
export type AllowedComponent = { type: ComponentType; customId: string };

/** メッセージに設置できるインタラクティブコンポーネントの動作 */
export type ComponentAction = AllowedComponent & { label: string };

export const AutoCreateThreadCustomIdPrefix = 'auto-create-thread:';

/** 自動作成したスレッドのメッセージに設置できるボタンの動作 */
export const autoCreateThreadActions = [
  {
    type: ComponentType.Button,
    customId: `${AutoCreateThreadCustomIdPrefix}archive`,
    label: 'スレッドをアーカイブする',
  },
  {
    type: ComponentType.Button,
    customId: `${AutoCreateThreadCustomIdPrefix}lock`,
    label: 'スレッドをロックする',
  },
  {
    type: ComponentType.Button,
    customId: `${AutoCreateThreadCustomIdPrefix}archive-lock`,
    label: 'スレッドをアーカイブ&ロックする',
  },
] satisfies ComponentAction[];

export type InteractiveComponent = {
  type: unknown;
  customId: unknown;
  /** コンポーネントツリー内のパス */
  path: (string | number)[];
};

/** コンポーネントツリーに含まれる、`custom_id`を持つ全てのコンポーネントを返す */
export function collectInteractiveComponents(
  value: unknown,
  path: (string | number)[] = [],
): InteractiveComponent[] {
  if (!value || typeof value !== 'object') return [];
  const children = Object.entries(value).flatMap(([key, v]) =>
    collectInteractiveComponents(v, [...path, Array.isArray(value) ? Number(key) : key]),
  );
  if (!('custom_id' in value)) return children;
  return [
    { type: (value as { type?: unknown }).type, customId: value.custom_id, path },
    ...children,
  ];
}

/** `type`と`custom_id`の組が許可されているかどうか */
export function isAllowedComponent(
  allowed: readonly AllowedComponent[],
  { type, customId }: Pick<InteractiveComponent, 'type' | 'customId'>,
) {
  return allowed.some((c) => c.type === type && c.customId === customId);
}
