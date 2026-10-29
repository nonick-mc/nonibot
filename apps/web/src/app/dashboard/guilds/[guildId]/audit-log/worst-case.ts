// break-ui: 開発時専用。`?data=worst|empty|one` で本番データの代わりに差し込む
import type {
  InternalApiChannel,
  InternalApiRole,
  InternalApiRoleColors,
} from '@repo/shared/types';
import { ChannelType, ComponentType } from 'discord-api-types/v10';
import type { CustomizedAuditLog } from './columns';
import type { Resources } from './describe';

export const DevDataModes = ['demo', 'worst', 'empty', 'one'] as const;
export type DevDataMode = (typeof DevDataModes)[number];

const colors: InternalApiRoleColors = {
  primary_color: 0,
  secondary_color: null,
  tertiary_color: null,
};
const role = (id: string, name: string, c = colors): InternalApiRole => ({
  id,
  name,
  position: 1,
  colors: c,
  managed: false,
  permissions: '0',
});
const channel = (id: string, name: string): InternalApiChannel => ({
  id,
  name,
  position: 1,
  parent_id: null,
  bot_permissions: '0',
  type: ChannelType.GuildText,
});

// 実在するロール名・チャンネル名の上限は100文字
const LongName =
  'プロジェクト横断・全社ミーティング運営委員会・議事録確認担当・外部パートナー連絡窓口'.padEnd(
    100,
    '■',
  );

export const worstCaseResources: Resources = {
  channels: [channel('c1', LongName), channel('c2', 'general')],
  roles: [
    role('r1', LongName, {
      primary_color: 0x5865f2,
      secondary_color: 0xeb459e,
      tertiary_color: null,
    }),
    role('r2', 'mod'),
    // r3以降は削除済み(一覧に存在しない)ロールとして扱う
  ],
};

const text = (content: string) => [{ type: ComponentType.TextDisplay, content }];
const LongUrl =
  'https://www.example-corporation-holdings.co.jp/news/2026/10/30/annual-membership-renewal-guide-for-all-regional-chapters/index.html?utm_source=discord&utm_medium=bot';

const base = { guildId: '1', createdAt: new Date() };
const author = (username: string, displayName: string) => ({
  username,
  displayName,
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
});

const deletedRoles = Array.from({ length: 18 }, (_, i) => `r${i + 3}`);
const rows: CustomizedAuditLog[] = [
  {
    ...base,
    id: 'w1',
    targetName: 'auto_mod',
    actionType: 'update_guild_setting',
    author: author('bartholomew_fitzgerald_northwi', 'Bartholomew Fitzgerald-Northwind III'),
    before: {
      enabled: true,
      domainList: [],
      ignoreChannels: ['c2'],
      ignoreRoles: ['r2'],
      enableInviteUrlFilter: false,
    },
    after: {
      enabled: false,
      domainList: [
        // ラベル1つの上限は63文字(RFC 1035)。ハイフンがなければ改行位置もない
        'internationalcommunicationsandmediaservicesgroupholdings.example.com',
      ],
      ignoreChannels: ['c1', 'c2'],
      ignoreRoles: ['r1', 'r2', ...deletedRoles],
      enableInviteUrlFilter: true,
    },
  },
  {
    ...base,
    id: 'w2',
    targetName: 'auto_create_thread',
    actionType: 'update_rule',
    author: author('jo', 'Jo'),
    before: { threadName: '週次', channelId: 'c2', initialThreadState: 'open', ignoreRoles: [] },
    after: {
      // アンダースコア区切りは改行位置がなく、実在する命名パターン(上限100文字)
      threadName:
        'weekly_engineering_sync_notes_and_action_items_for_the_platform_team_draft_v2_final',
      channelId: 'c3',
      initialThreadState: 'archived_locked',
      ignoreRoles: ['r1'],
    },
  },
  {
    ...base,
    id: 'w3',
    targetName: 'custom_action',
    actionType: 'update_custom_action',
    author: author('nonick_mc', 'NoNICK'),
    before: {
      name: 'ロール付与',
      steps: [
        { type: 'role-toggle', config: { roleId: 'r2' } },
        { type: 'reply-message', config: { components: text('完了'), ephemeral: true } },
      ],
    },
    after: {
      name: '新入生向けのロール付与(2026年度・春入学・学部横断)',
      steps: [
        { type: 'role-toggle', config: { roleId: 'r1' } },
        {
          type: 'reply-message',
          config: { components: text(`詳細はこちら ${LongUrl}`), ephemeral: false },
        },
      ],
    },
  },
  {
    ...base,
    id: 'w4',
    targetName: 'join_message',
    actionType: 'update_guild_setting',
    author: null,
    before: { enabled: false, channel: null, messageComponents: text('ようこそ') },
    after: { enabled: true, channel: 'c1', messageComponents: [] },
  },
  {
    ...base,
    id: 'w5',
    targetName: 'verification',
    actionType: 'update_guild_setting',
    author: author('a'.repeat(32), 'a'.repeat(32)),
    before: { enabled: true, role: 'r1' },
    after: null,
  },
];

export function getWorstCase(mode: Exclude<DevDataMode, 'demo'>) {
  const data = mode === 'empty' ? [] : mode === 'one' ? rows.slice(0, 1) : rows;
  return { rows: data, total: data.length, resources: worstCaseResources };
}
