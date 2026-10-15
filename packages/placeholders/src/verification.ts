import type { Placeholder } from './type';

export const verificationMessagePlaceholders = [
  { key: 'serverName', description: 'サーバー名', type: 'text' },
  { key: 'serverIcon', description: 'サーバーのアイコンURL', type: 'url' },
  { key: 'role', description: '認証後に付与されるロールのメンション', type: 'mention' },
] as const satisfies Placeholder;
