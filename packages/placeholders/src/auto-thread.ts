import type { Placeholder } from './type';

export const autoThreadPlaceholders = [
  { key: 'userName', description: 'メッセージ送信者のユーザー名' },
  { key: 'userGlobalName', description: 'メッセージ送信者の表示名' },
  { key: 'userDisplayName', description: 'メッセージ送信者のサーバーニックネーム' },
  { key: 'createdAt', description: 'メッセージの送信日時 (YYYY-MM-DD HH:MM)' },
  { key: 'createdAtDate', description: 'メッセージの送信日 (YYYY-MM-DD)' },
  { key: 'createdAtTime', description: 'メッセージの送信時刻 (HH:MM)' },
] as const satisfies Placeholder;
