'use client';

import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import 'dayjs/locale/ja';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { CalendarIcon, CrownIcon, ServerIcon, UsersIcon } from 'lucide-react';
import { initials } from '@/app/dashboard/guilds/[guildId]/audit-log/columns';
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid';
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

export type GuildOwner = {
  displayName: string;
  username: string;
  avatarUrl: string;
};

export type AdminGuildRow = {
  id: string;
  createdAt: string;
  summary: { name: string; icon: string | null; owner_id: string; member_count: number } | null;
  owner: GuildOwner | null;
};

export const columns: ColumnDef<DataGridFeatures, AdminGuildRow>[] = [
  {
    id: 'guild',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='サーバー'
        icon={<ServerIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row: { original: guild } }) => (
      <div className='flex items-center gap-3'>
        <Avatar className='size-9'>
          <AvatarImage
            className='bg-muted'
            src={
              guild.summary?.icon
                ? RouteBases.cdn +
                  CDNRoutes.guildIcon(guild.id, guild.summary.icon, ImageFormat.WebP)
                : undefined
            }
          />
          <AvatarFallback>{guild.summary ? initials(guild.summary.name) : '?'}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col leading-tight'>
          {guild.summary ? (
            <span className='max-w-80 truncate text-sm'>{guild.summary.name}</span>
          ) : (
            <span className='text-muted-foreground text-sm'>取得できません</span>
          )}
          <span className='text-muted-foreground text-xs'>{guild.id}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'memberCount',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='メンバー数'
        icon={<UsersIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row }) => row.original.summary?.member_count.toLocaleString('ja-JP') ?? '-',
  },
  {
    id: 'owner',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='オーナー'
        icon={<CrownIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row: { original: guild } }) => {
      if (!guild.summary) return '-';
      if (!guild.owner) {
        return <span className='text-muted-foreground text-xs'>{guild.summary.owner_id}</span>;
      }

      return (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarImage src={guild.owner.avatarUrl} />
            <AvatarFallback>{initials(guild.owner.displayName)}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col leading-tight'>
            <span className='max-w-48 truncate text-sm'>{guild.owner.displayName}</span>
            <span className='max-w-48 truncate text-muted-foreground text-xs'>
              @{guild.owner.username}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: 'joinedAt',
    header: ({ column }) => (
      <DataGridColumnHeader
        column={column}
        title='追加日時'
        icon={<CalendarIcon className='mt-0.5' />}
      />
    ),
    cell: ({ row }) => dayjs(row.original.createdAt).tz().format('YYYY/MM/DD HH:mm'),
  },
];
