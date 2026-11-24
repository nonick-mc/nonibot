import {
  ArrowRightFromSquare,
  ArrowRightToSquare,
  Comments,
  FileText,
  Flag,
  Hammer,
  Link,
  Megaphone,
  PencilToSquare,
  QrCode,
  ShieldCheck,
  Star,
  Thunderbolt,
} from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';

export type FeatureIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type FeatureInfo = {
  title: string;
  description: string;
  icon: FeatureIcon;
};

export const FeatureInfos = {
  'join-message': {
    title: '入室メッセージ',
    description: 'サーバーにユーザーが参加した際にメッセージを送信します。',
    icon: ArrowRightToSquare,
  },
  'leave-message': {
    title: '退室メッセージ',
    description: 'サーバーからユーザーが退室した際にメッセージを送信します。',
    icon: ArrowRightFromSquare,
  },
  level: {
    title: 'レベルシステム',
    description: 'メッセージを送信したユーザーに経験値を付与します。',
    icon: Star,
  },
  'message-expand': {
    title: 'メッセージURL展開',
    description: 'DiscordのメッセージURLが送信された際に、そのメッセージの内容を追加で送信します。',
    icon: Link,
  },
  'auto-create-thread': {
    title: '自動スレッド作成',
    description: '指定したチャンネルにメッセージが投稿された際、自動でスレッドを作成します。',
    icon: Comments,
  },
  'auto-public': {
    title: '自動アナウンス公開',
    description: 'アナウンスチャンネルに投稿されたメッセージを自動で公開します。',
    icon: Megaphone,
  },
  'event-log': {
    title: 'イベントログ',
    description: 'サーバー内の出来事をチャンネルにログとして送信します。',
    icon: FileText,
  },
  'automod-plus': {
    title: 'AutoMod Plus',
    description: '設定したフィルターに検知されたメッセージを自動で削除します。',
    icon: Hammer,
  },
  report: {
    title: 'サーバー内通報',
    description: '不適切なメッセージやユーザーをメンバーが通報できるようにします。',
    icon: Flag,
  },
  'auto-change-verification-level': {
    title: '自動認証レベル変更',
    description: 'サーバーの認証レベルを特定の時間帯だけ変更します。',
    icon: ShieldCheck,
  },
  verification: {
    title: 'メンバー認証',
    description: '特定の認証を行ったユーザーにロールを付与します。',
    icon: QrCode,
  },
  'custom-message': {
    title: 'カスタムメッセージ',
    description: 'サーバー内の任意のチャンネルにメッセージを送信します。',
    icon: PencilToSquare,
  },
  'custom-action': {
    title: 'カスタムアクション',
    description: 'ボタンを押したときに実行するアクションを管理します。',
    icon: Thunderbolt,
  },
} as const satisfies Record<string, FeatureInfo>;

export type FeatureKey = keyof typeof FeatureInfos;
