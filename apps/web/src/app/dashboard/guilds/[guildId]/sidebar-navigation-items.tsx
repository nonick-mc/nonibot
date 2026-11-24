import { LayoutSplitSideContentLeft, ListUl } from '@gravity-ui/icons';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { type FeatureIcon, FeatureInfos, type FeatureKey } from './feature-info';

type SidebarGroupItem<T> = {
  title: string;
  items: SidebarItem<T>[];
};

type SidebarItem<T> = {
  title: string;
  key?: string;
  url: (arg: T) => string;
  badge?: ReactNode;
  icon: FeatureIcon;
  subitems?: SidebarSubItem[];
  disabled?: boolean;
};

type SidebarSubItem = {
  title: string;
  key?: string;
  badge?: ReactNode;
  disabled?: boolean;
};

const featureItem = (
  key: FeatureKey,
  extra?: Partial<SidebarItem<string>>,
): SidebarItem<string> => ({
  key,
  title: FeatureInfos[key].title,
  icon: FeatureInfos[key].icon,
  url: (guildId) => `/dashboard/guilds/${guildId}/${key}`,
  ...extra,
});

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
      featureItem('join-message'),
      featureItem('leave-message'),
      featureItem('level', { badge: <Badge>Beta</Badge> }),
      featureItem('report'),
      featureItem('event-log'),
      featureItem('message-expand'),
      featureItem('auto-change-verification-level'),
      featureItem('auto-public'),
      featureItem('auto-create-thread'),
      featureItem('automod-plus'),
      featureItem('verification'),
    ],
  },
  {
    title: 'ツール',
    items: [featureItem('custom-message'), featureItem('custom-action')],
  },
];
