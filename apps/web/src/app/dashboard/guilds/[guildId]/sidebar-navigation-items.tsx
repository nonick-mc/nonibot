import {
  ArrowRightFromSquare,
  ArrowRightToSquare,
  Clock,
  Comments,
  FileText,
  Flag,
  Hammer,
  LayoutSplitSideContentLeft,
  Link,
  ListUl,
  Medal,
  Megaphone,
  PencilToSquare,
  QrCode,
  ShieldCheck,
  Star,
  Thunderbolt,
} from '@gravity-ui/icons';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Badge } from '@/components/ui/badge';

type SidebarIcon = ComponentType<SVGProps<SVGSVGElement>>;

type SidebarGroupItem<T> = {
  title: string;
  items: SidebarItem<T>[];
};

type SidebarItem<T> = {
  title: string;
  key?: string;
  url: (arg: T) => string;
  badge?: ReactNode;
  icon: SidebarIcon;
  subitems?: SidebarSubItem[];
  disabled?: boolean;
};

type SidebarSubItem = {
  title: string;
  key?: string;
  badge?: ReactNode;
  disabled?: boolean;
};

export const SidebarNavigationItems: SidebarGroupItem<string>[] = [
  {
    title: '管理',
    items: [
      {
        title: 'ダッシュボード',
        url: (guildId) => `/dashboard/guilds/${guildId}`,
        icon: LayoutSplitSideContentLeft,
      },
      {
        key: 'audit-log',
        title: '監査ログ',
        url: (guildId) => `/dashboard/guilds/${guildId}/audit-log`,
        icon: ListUl,
      },
    ],
  },
  {
    title: '機能',
    items: [
      {
        key: 'join-message',
        title: '入室メッセージ',
        url: (guildId) => `/dashboard/guilds/${guildId}/join-message`,
        icon: ArrowRightToSquare,
      },
      {
        key: 'leave-message',
        title: '退室メッセージ',
        url: (guildId) => `/dashboard/guilds/${guildId}/leave-message`,
        icon: ArrowRightFromSquare,
      },
      {
        key: 'level',
        title: 'レベルシステム',
        url: (guildId) => `/dashboard/guilds/${guildId}/level`,
        icon: Star,
        badge: <Badge>Beta</Badge>,
      },
      {
        key: 'report',
        title: 'サーバー内通報',
        url: (guildId) => `/dashboard/guilds/${guildId}/report`,
        icon: Flag,
      },
      {
        key: 'event-log',
        title: 'イベントログ',
        url: (guildId) => `/dashboard/guilds/${guildId}/event-log`,
        icon: FileText,
      },
      {
        key: 'message-expand',
        title: 'メッセージURL展開',
        url: (guildId) => `/dashboard/guilds/${guildId}/message-expand`,
        icon: Link,
      },
      {
        key: 'auto-change-verification-level',
        title: '自動認証レベル変更',
        url: (guildId) => `/dashboard/guilds/${guildId}/auto-change-verification-level`,
        icon: ShieldCheck,
      },
      {
        key: 'auto-public',
        title: '自動アナウンス公開',
        url: (guildId) => `/dashboard/guilds/${guildId}/auto-public`,
        icon: Megaphone,
      },
      {
        key: 'auto-create-thread',
        title: '自動スレッド作成',
        url: (guildId) => `/dashboard/guilds/${guildId}/auto-create-thread`,
        icon: Comments,
      },
      {
        key: 'automod-plus',
        title: 'AutoMod Plus',
        url: (guildId) => `/dashboard/guilds/${guildId}/automod-plus`,
        icon: Hammer,
      },
      {
        key: 'verification',
        title: 'メンバー認証',
        url: (guildId) => `/dashboard/guilds/${guildId}/verification`,
        icon: QrCode,
      },
    ],
  },
  {
    title: 'ツール',
    items: [
      {
        key: 'custom-message',
        title: 'カスタムメッセージ',
        url: (guildId) => `/dashboard/guilds/${guildId}/custom-message`,
        icon: PencilToSquare,
      },
      {
        key: 'custom-action',
        title: 'カスタムアクション',
        url: (guildId) => `/dashboard/guilds/${guildId}/custom-action`,
        icon: Thunderbolt,
      },
      {
        key: 'scheduled-post',
        title: '予約投稿',
        url: (guildId) => `/dashboard/guilds/${guildId}/scheduled-post`,
        icon: Clock,
        badge: <Badge variant='outline'>近日公開</Badge>,
        disabled: true,
      },
    ],
  },
];
