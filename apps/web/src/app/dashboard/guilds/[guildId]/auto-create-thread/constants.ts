import { ThreadAutoArchiveDuration } from 'discord-api-types/v10';

export const RulesMaxSize = 10;

export const ArchiveDurationOptions = [
  { label: '1時間', value: ThreadAutoArchiveDuration.OneHour },
  { label: '24時間', value: ThreadAutoArchiveDuration.OneDay },
  { label: '3日間', value: ThreadAutoArchiveDuration.ThreeDays },
  { label: '1週間', value: ThreadAutoArchiveDuration.OneWeek },
];

export const ThreadStateOptions = [
  { label: 'オープン', value: 'open' },
  { label: 'アーカイブ', value: 'archived' },
  { label: 'ロック', value: 'locked' },
] as const;
