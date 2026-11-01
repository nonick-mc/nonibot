import type { Placeholder } from './type';

export const leaveMessagePlaceholders = [
  { key: 'serverName', description: 'サーバー名', type: 'text' },
  { key: 'memberCount', description: 'サーバーの参加人数', type: 'text' },
  { key: 'user', description: '退室したユーザーのメンション', type: 'mention' },
  { key: 'userName', description: '退室したユーザーのユーザー名', type: 'text' },
  {
    key: 'userTag',
    description: '退室したユーザーのユーザー名とタグ(#0000)',
    type: 'text',
    deprecated: true,
  },
  { key: 'userAvatar', description: '退室したユーザーのアバターURL', type: 'url' },
] as const satisfies Placeholder;
