import type { Placeholder } from './type';

export const autoThreadPlaceholders = [
  { key: 'userName', description: 'メッセージ送信者のユーザー名', type: 'text' },
  { key: 'userGlobalName', description: 'メッセージ送信者の表示名', type: 'text' },
  { key: 'userDisplayName', description: 'メッセージ送信者のサーバーニックネーム', type: 'text' },
  { key: 'createdAt', description: 'メッセージの送信日時 (YYYY-MM-DD HH:MM)', type: 'text' },
  { key: 'createdAtDate', description: 'メッセージの送信日 (YYYY-MM-DD)', type: 'text' },
  { key: 'createdAtTime', description: 'メッセージの送信時刻 (HH:MM)', type: 'text' },
] as const satisfies Placeholder;
