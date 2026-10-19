import type { Placeholder } from './type';

export const verificationMessagePlaceholders = [
  { key: 'role', description: '認証後に付与されるロールのメンション', type: 'mention' },
] as const satisfies Placeholder;
