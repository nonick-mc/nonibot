// break-ui: 開発時専用。`?data=worst|empty|one` で本番データの代わりに差し込む
import type { DevDataMode } from '@/app/dashboard/guilds/[guildId]/audit-log/worst-case';
import type { AdminGuildRow } from './columns';

// サーバー名の上限は100文字
const LongName =
  'プロジェクト横断・全社ミーティング運営委員会・議事録確認担当・外部パートナー連絡窓口'.padEnd(
    100,
    '■',
  );

const owners = {
  long: {
    displayName: LongName,
    username: 'unbreakable_username_without_any_spaces_or_separators_0123456789',
    avatarUrl: '',
  },
  short: { displayName: 'a', username: 'a', avatarUrl: '' },
  emoji: { displayName: '🇯🇵👨‍👩‍👧‍👦 おーなー 🎉', username: 'owner', avatarUrl: '' },
};

const row = (
  id: string,
  name: string | null,
  member_count: number,
  // `null`は、オーナーのユーザー情報が取得できない場合
  owner: AdminGuildRow['owner'] = owners.short,
  createdAt = '2026-10-30T12:34:56.000Z',
): AdminGuildRow => ({
  id,
  createdAt,
  summary:
    name === null ? null : { name, icon: null, owner_id: '1234567890123456789', member_count },
  owner,
});

const worst: AdminGuildRow[] = [
  row('1234567890123456789', LongName, 99_999_999, owners.long),
  row('1234567890123456788', 'a', 0),
  row('1234567890123456787', '🇯🇵👨‍👩‍👧‍👦 絵文字だけの名前 🎉', 1, owners.emoji),
  row('1234567890123456786', 'Unbreakable_Server_Name_Without_Any_Spaces_'.repeat(2), 12_345, null),
  row(
    '1234567890123456785',
    '日本語のサーバー',
    1_000_000,
    owners.short,
    '2020-01-01T00:00:00.000Z',
  ),
  // Botのキャッシュにないサーバー
  row('1234567890123456784', null, 0),
];

export function getWorstCase(mode: Exclude<DevDataMode, 'demo'>) {
  switch (mode) {
    case 'worst':
      return { allTotal: 12_345_678, total: 12_345_678, rows: worst };
    case 'empty':
      return { allTotal: 0, total: 0, rows: [] };
    case 'one':
      return { allTotal: 1, total: 1, rows: worst.slice(1, 2) };
  }
}
