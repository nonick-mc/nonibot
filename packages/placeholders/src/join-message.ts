import type { Placeholder } from './type';

export const joinMessagePlaceholders = [
  { key: 'serverName', description: 'サーバー名' },
  { key: 'memberCount', description: 'サーバーの参加人数' },
  { key: 'user', description: '入室したユーザーのメンション' },
  { key: 'userName', description: '入室したユーザーのユーザー名' },
  { key: 'userTag', description: '入室したユーザーのユーザー名とタグ(#0000)', deprecated: true },
  { key: 'userAvatar', description: '入室したユーザーのアバターURL', isUrl: true },
] as const satisfies Placeholder;
