import type { Placeholder } from './type';

export const JoinMessagePlaceholders = [
  { key: 'serverName', description: 'サーバー名' },
  { key: 'memberCount', description: 'サーバーの参加人数' },
  { key: 'user', description: '入室したユーザーのメンション' },
  { key: 'userName', description: '入室したユーザーのユーザー名' },
] as const satisfies Placeholder;
