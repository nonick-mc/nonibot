import type { Placeholder } from './type';

export const levelNotifyMessagePlaceholders = [
  { key: 'serverName', description: 'サーバー名', type: 'text' },
  { key: 'user', description: 'レベルアップしたユーザーのメンション', type: 'mention' },
  { key: 'userName', description: 'レベルアップしたユーザーのユーザー名', type: 'text' },
  { key: 'userAvatar', description: 'レベルアップしたユーザーのアバターURL', type: 'url' },
  { key: 'level', description: 'レベルアップ後のレベル', type: 'text' },
] as const satisfies Placeholder;
