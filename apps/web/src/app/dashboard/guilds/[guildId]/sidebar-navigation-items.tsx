import {
  CalendarClockIcon,
  ClipboardListIcon,
  FlagIcon,
  HammerIcon,
  LayoutGridIcon,
  Link2Icon,
  LogInIcon,
  LogOutIcon,
  LogsIcon,
  type LucideIcon,
  MegaphoneIcon,
  ScanQrCodeIcon,
  ShieldCheckIcon,
  SpoolIcon,
  SquarePenIcon,
  ZapIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/reui/badge';

type SidebarGroupItem<T> = {
  title: string;
  items: SidebarItem<T>[];
};

type SidebarItem<T> = {
  title: string;
  key?: string;
  url: (arg: T) => string;
  badge?: ReactNode;
  icon: LucideIcon;
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
        icon: LayoutGridIcon,
      },
      {
        key: 'audit-log',
        title: '監査ログ',
        url: (guildId) => `/dashboard/guilds/${guildId}/audit-log`,
        icon: LogsIcon,
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
        icon: LogInIcon,
      },
      {
        key: 'leave-message',
        title: '退室メッセージ',
        url: (guildId) => `/dashboard/guilds/${guildId}/leave-message`,
        icon: LogOutIcon,
      },
      {
        key: 'report',
        title: 'サーバー内通報',
        url: (guildId) => `/dashboard/guilds/${guildId}/report`,
        icon: FlagIcon,
      },
      {
        key: 'event-log',
        title: 'イベントログ',
        url: (guildId) => `/dashboard/guilds/${guildId}/event-log`,
        icon: ClipboardListIcon,
      },
      {
        key: 'message-expand',
        title: 'メッセージURL展開',
        url: (guildId) => `/dashboard/guilds/${guildId}/message-expand`,
        icon: Link2Icon,
      },
      {
        key: 'auto-change-verification-level',
        title: '自動認証レベル変更',
        url: (guildId) => `/dashboard/guilds/${guildId}/auto-change-verification-level`,
        icon: ShieldCheckIcon,
      },
      {
        key: 'auto-public',
        title: '自動アナウンス公開',
        url: (guildId) => `/dashboard/guilds/${guildId}/auto-public`,
        icon: MegaphoneIcon,
      },
      {
        key: 'auto-create-thread',
        title: '自動スレッド作成',
        url: (guildId) => `/dashboard/guilds/${guildId}/auto-create-thread`,
        icon: SpoolIcon,
      },
      {
        key: 'automod-plus',
        title: 'AutoMod Plus',
        url: (guildId) => `/dashboard/guilds/${guildId}/automod-plus`,
        icon: HammerIcon,
      },
      {
        key: 'verification',
        title: 'メンバー認証',
        url: (guildId) => `/dashboard/guilds/${guildId}/verification`,
        icon: ScanQrCodeIcon,
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
        icon: SquarePenIcon,
      },
      {
        key: 'custom-action',
        title: 'カスタムアクション',
        url: (guildId) => `/dashboard/guilds/${guildId}/custom-action`,
        icon: ZapIcon,
      },
      {
        key: 'scheduled-post',
        title: '予約投稿',
        url: (guildId) => `/dashboard/guilds/${guildId}/scheduled-post`,
        icon: CalendarClockIcon,
        badge: <Badge variant='outline'>近日公開</Badge>,
        disabled: true,
      },
    ],
  },
];
