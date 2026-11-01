import type { Placeholder } from './type';

export const customActionBasePlaceholders = [
  { key: 'serverName', description: 'サーバー名', type: 'text' },
  { key: 'memberCount', description: 'サーバーの参加人数', type: 'text' },
  { key: 'user', description: 'ボタンを押したユーザーのメンション', type: 'mention' },
  { key: 'userName', description: 'ボタンを押したユーザーのユーザー名', type: 'text' },
  { key: 'userAvatar', description: 'ボタンを押したユーザーのアバターURL', type: 'url' },
] as const satisfies Placeholder;

export const customActionStepPlaceholders = {
  'role-toggle': [
    { key: 'roleToggleRole', description: '付与・解除したロールのメンション', type: 'mention' },
    { key: 'roleToggleResult', description: '「付与」または「解除」', type: 'text' },
  ],
  'reply-message': [],
} as const satisfies Record<string, Placeholder>;

export type CustomActionStepType = keyof typeof customActionStepPlaceholders;

export function getCustomActionPlaceholders(
  precedingTypes: readonly CustomActionStepType[],
): Placeholder {
  return [
    ...customActionBasePlaceholders,
    ...precedingTypes.flatMap((type) => customActionStepPlaceholders[type]),
  ];
}
