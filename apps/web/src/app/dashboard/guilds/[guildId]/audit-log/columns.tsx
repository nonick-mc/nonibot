'use client';

import type { auditLog } from '@repo/database';
import dayjs from 'dayjs';
import type { InferSelectModel } from 'drizzle-orm';
import 'dayjs/locale/ja';
import type { ColumnDef } from '@tanstack/react-table';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ClockIcon, TargetIcon, UserIcon, ZapIcon } from 'lucide-react';
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

dayjs.locale('ja');
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

type AuditLog = InferSelectModel<typeof auditLog>;

export const targetNameTexts: Record<AuditLog['targetName'], string> = {
  guild: 'サーバー',
  join_message: '入室メッセージ',
  leave_message: '退室メッセージ',
  report: 'サーバー内通報',
  timeout_log: 'タイムアウトログ',
  kick_log: 'キックログ',
  ban_log: 'BANログ',
  voice_log: 'ボイスチャンネルログ',
  message_delete_log: 'メッセージ削除ログ',
  message_edit_log: 'メッセージ編集ログ',
  message_expand: 'メッセージURL展開',
  auto_change_verify_level: '自動認証レベル変更',
  auto_public: '自動アナウンス公開',
  auto_create_thread: '自動スレッド作成',
  auto_mod: 'AutoMod Plus',
  verification: 'メンバー認証',
  custom_message: 'カスタムメッセージ',
  custom_action: 'カスタムアクション',
};

export const actionTypeTexts: Record<AuditLog['actionType'], string> = {
  update_guild_setting: '設定に変更を加えました',
  create_rule: 'ルールを作成しました',
  update_rule: 'ルールを更新しました',
  delete_rule: 'ルールを削除しました',
  send_verification_panel: '認証パネルを送信しました',
  send_custom_message: 'メッセージを送信しました',
  update_custom_message: 'メッセージを更新しました',
  delete_custom_message: 'メッセージを削除しました',
  create_custom_action: 'アクションを作成しました',
  update_custom_action: 'アクションを更新しました',
  delete_custom_action: 'アクションを削除しました',
};

export type AuditLogAuthor = {
  displayName: string;
  username: string;
  avatarUrl: string;
};

export type CustomizedAuditLog = Omit<AuditLog, 'authorId'> & {
  author: AuditLogAuthor | null;
};

export const columns: ColumnDef<DataGridFeatures, CustomizedAuditLog>[] = [
  {
    id: 'author',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='ユーザー'
        icon={<UserIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row }) => {
      const { author } = row.original;
      if (!author) return <span className='text-muted-foreground'>不明なユーザー</span>;

      return (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarImage src={author.avatarUrl} />
            <AvatarFallback>{author.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col leading-tight'>
            <span className='text-sm'>{author.displayName}</span>
            <span className='text-muted-foreground text-xs'>@{author.username}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: 'targetName',
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title='対象' icon={<TargetIcon className='mt-0.5' />} />
    ),
    cell: ({ row }) => targetNameTexts[row.original.targetName] ?? '不明なターゲット',
  },
  {
    id: 'actionType',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='アクション'
        icon={<ZapIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row }) => actionTypeTexts[row.original.actionType] ?? '不明なアクション',
  },
  {
    id: 'createdAt',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='実行日時'
        icon={<ClockIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row }) => {
      const createdAt = dayjs(row.original.createdAt).tz();
      const formatted = createdAt.format('YYYY/MM/DD HH:mm');

      if (dayjs().diff(createdAt, 'day') >= 1) return formatted;

      return (
        <Tooltip>
          <TooltipTrigger>{createdAt.fromNow()}</TooltipTrigger>
          <TooltipContent>{formatted}</TooltipContent>
        </Tooltip>
      );
    },
  },
];
