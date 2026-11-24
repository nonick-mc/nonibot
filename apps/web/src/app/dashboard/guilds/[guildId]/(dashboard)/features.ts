import { Gear, Persons, Shield, Wrench } from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';
import { type FeatureInfo, FeatureInfos, type FeatureKey } from '../feature-info';

export type DashboardFeature = FeatureInfo & {
  key: FeatureKey;
  hasStatus: boolean;
};

const feature = (key: FeatureKey, hasStatus = true): DashboardFeature => ({
  key,
  ...FeatureInfos[key],
  hasStatus,
});

export const DashboardFeatureCategories: {
  value: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  features: DashboardFeature[];
}[] = [
  {
    value: 'community',
    label: 'コミュニティ',
    icon: Persons,
    features: [
      feature('join-message'),
      feature('leave-message'),
      feature('level'),
      feature('message-expand'),
      feature('auto-create-thread'),
      feature('auto-public'),
    ],
  },
  {
    value: 'management',
    label: '管理',
    icon: Gear,
    features: [feature('event-log'), feature('automod-plus'), feature('report')],
  },
  {
    value: 'security',
    label: 'セキュリティ',
    icon: Shield,
    features: [feature('auto-change-verification-level'), feature('verification')],
  },
  {
    value: 'tools',
    label: 'ツール',
    icon: Wrench,
    features: [feature('custom-message', false), feature('custom-action', false)],
  },
];
