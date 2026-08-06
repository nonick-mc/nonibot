import type { Placeholder } from './type';

export const LeaveMessagePlaceholders = [
  { key: 'serverName', description: 'サーバー名' },
  { key: 'memberCount', description: 'サーバーの参加人数' },
  { key: 'user', description: '退室したユーザーのメンション' },
  { key: 'userName', description: '退室したユーザーのユーザー名' },
  { key: 'userTag', description: '退室したユーザーのユーザー名とタグ(#0000)', deprecated: true },
  { key: 'userAvatar', description: '退室したユーザーのアバターURL', isUrl: true },
] as const satisfies Placeholder;
