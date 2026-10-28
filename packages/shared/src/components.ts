import { ComponentType } from 'discord-api-types/v10';

/**
 * 許可リストの要素。`customId`は完全一致、`customIdPattern`は正規表現で判定する。
 */
export type BaseAllowedComponent =
  | { type: ComponentType; customId: string }
  | { type: ComponentType; customIdPattern: RegExp };
/** エディタの選択肢にもなる、完全一致の`customId`を持つ許可コンポーネント */
export type AllowedComponent = Extract<BaseAllowedComponent, { customId: string }> & {
  label: string;
};

export const RoleButtonCustomIdPrefix = 'custom-message:role-button:';
const roleButtonCustomIdRegex = new RegExp(`^${RoleButtonCustomIdPrefix}(\\d{17,19})$`);

// #region ロール付与・解除ボタン
export const createRoleButtonCustomId = (roleId: string) => `${RoleButtonCustomIdPrefix}${roleId}`;
export const parseRoleButtonCustomId = (customId: unknown) =>
  (typeof customId === 'string' && roleButtonCustomIdRegex.exec(customId)?.[1]) || null;

export const roleButtonAllowedComponent = {
  type: ComponentType.Button,
  customIdPattern: roleButtonCustomIdRegex,
} satisfies BaseAllowedComponent;
// #endregion

// #region カスタムアクション
export const CustomActionCustomIdPrefix = 'custom-action:';
const customActionCustomIdRegex = new RegExp(
  `^${CustomActionCustomIdPrefix}([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`,
);

export const createCustomActionCustomId = (actionId: string) =>
  `${CustomActionCustomIdPrefix}${actionId}`;
export const parseCustomActionCustomId = (customId: unknown) =>
  (typeof customId === 'string' && customActionCustomIdRegex.exec(customId)?.[1]) || null;

export const customActionAllowedComponent = {
  type: ComponentType.Button,
  customIdPattern: customActionCustomIdRegex,
} satisfies BaseAllowedComponent;
// #endregion

// #region 自動スレッド作成
export const AutoCreateThreadCustomIdPrefix = 'auto-create-thread:';
export const autoCreateThreadAllowedComponents = [
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
] satisfies AllowedComponent[];
// #endregion

// #region メンバー認証
export const VerificationCustomIdPrefix = 'verification:';
export const verificationAllowedComponents = [
  {
    type: ComponentType.Button,
    customId: `${VerificationCustomIdPrefix}verify`,
    label: 'メンバー認証を開始する',
  },
] satisfies AllowedComponent[];
// #endregion

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
  allowed: readonly BaseAllowedComponent[],
  { type, customId }: Pick<InteractiveComponent, 'type' | 'customId'>,
) {
  return allowed.some(
    (c) =>
      c.type === type &&
      ('customId' in c
        ? c.customId === customId
        : typeof customId === 'string' && c.customIdPattern.test(customId)),
  );
}
