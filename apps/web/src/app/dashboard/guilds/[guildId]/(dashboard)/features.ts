import {
  ClipboardListIcon,
  FlagIcon,
  HammerIcon,
  Link2Icon,
  LogInIcon,
  LogOutIcon,
  type LucideIcon,
  MegaphoneIcon,
  ScanQrCodeIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SpoolIcon,
  SquarePenIcon,
  UsersIcon,
  WrenchIcon,
  ZapIcon,
} from 'lucide-react';

export type DashboardFeature = {
  /** `getFeatureStatuses` のキー兼、機能ページのパス */
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** 有効/無効の概念がない機能は false */
  hasStatus: boolean;
};

export const DashboardFeatureCategories: {
  value: string;
  label: string;
  icon: LucideIcon;
  features: DashboardFeature[];
}[] = [
  {
    value: 'community',
    label: 'コミュニティ',
    icon: UsersIcon,
    features: [
      {
        key: 'join-message',
        title: '入室メッセージ',
        description: 'サーバーにユーザーが参加した際にメッセージを送信します。',
        icon: LogInIcon,
        hasStatus: true,
      },
      {
        key: 'leave-message',
        title: '退室メッセージ',
        description: 'サーバーからユーザーが退室した際にメッセージを送信します。',
        icon: LogOutIcon,
        hasStatus: true,
      },
      {
        key: 'message-expand',
        title: 'メッセージURL展開',
        description:
          'DiscordのメッセージURLが送信された際に、そのメッセージの内容を追加で送信します。',
        icon: Link2Icon,
        hasStatus: true,
      },
      {
        key: 'auto-create-thread',
        title: '自動スレッド作成',
        description: '指定したチャンネルにメッセージが投稿された際、自動でスレッドを作成します。',
        icon: SpoolIcon,
        hasStatus: true,
      },
      {
        key: 'auto-public',
        title: '自動アナウンス公開',
        description: 'アナウンスチャンネルに投稿されたメッセージを自動で公開します。',
        icon: MegaphoneIcon,
        hasStatus: true,
      },
    ],
  },
  {
    value: 'management',
    label: '管理',
    icon: SettingsIcon,
    features: [
      {
        key: 'event-log',
        title: 'イベントログ',
        description: 'サーバー内の出来事をチャンネルにログとして送信します。',
        icon: ClipboardListIcon,
        hasStatus: true,
      },
      {
        key: 'automod-plus',
        title: 'AutoMod Plus',
        description: '設定したフィルターに検知されたメッセージを自動で削除します。',
        icon: HammerIcon,
        hasStatus: true,
      },
      {
        key: 'report',
        title: 'サーバー内通報',
        description: '不適切なメッセージやユーザーをメンバーが通報できるようにします。',
        icon: FlagIcon,
        hasStatus: true,
      },
    ],
  },
  {
    value: 'security',
    label: 'セキュリティ',
    icon: ShieldIcon,
    features: [
      {
        key: 'auto-change-verification-level',
        title: '自動認証レベル変更',
        description: 'サーバーの認証レベルを特定の時間帯だけ変更します。',
        icon: ShieldCheckIcon,
        hasStatus: true,
      },
      {
        key: 'verification',
        title: 'メンバー認証',
        description: '特定の認証を行ったユーザーにロールを付与します。',
        icon: ScanQrCodeIcon,
        hasStatus: true,
      },
    ],
  },
  {
    value: 'tools',
    label: 'ツール',
    icon: WrenchIcon,
    features: [
      {
        key: 'custom-message',
        title: 'カスタムメッセージ',
        description: 'サーバー内の任意のチャンネルにメッセージを送信します。',
        icon: SquarePenIcon,
        hasStatus: false,
      },
      {
        key: 'custom-action',
        title: 'カスタムアクション',
        description: 'ボタンを押したときに実行するアクションを管理します。',
        icon: ZapIcon,
        hasStatus: false,
      },
    ],
  },
];
