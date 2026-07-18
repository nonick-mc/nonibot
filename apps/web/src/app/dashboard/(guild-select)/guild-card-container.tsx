'use client';

import type { RESTAPIPartialCurrentUserGuild } from 'discord-api-types/v10';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useDebounceValue } from 'usehooks-ts';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { GuildCard } from './guild-card';

type GuildCardContainerProps = {
  guilds: RESTAPIPartialCurrentUserGuild[];
};

function StackedCardsIllustration() {
  return (
    <div className='relative h-24 w-52' aria-hidden='true'>
      {/* Back card */}
      <div className='bg-muted/60 dark:bg-muted/30 border-border/50 absolute inset-x-6 top-0 h-6 rounded-t-lg border' />
      {/* Middle card */}
      <div className='bg-muted/80 dark:bg-muted/50 border-border/60 absolute inset-x-3 top-3 h-6 rounded-t-lg border' />
      {/* Front card */}
      <div className='bg-background border-border absolute inset-x-0 top-6 flex h-16 items-center gap-3 rounded-lg border px-4 shadow-sm'>
        <div className='bg-muted size-8 shrink-0 rounded-full' />
        <div className='flex flex-1 flex-col gap-1.5'>
          <div className='bg-muted h-2.5 w-3/4 rounded' />
          <div className='bg-muted/60 h-2 w-1/2 rounded' />
        </div>
      </div>
      {/* Fade overlay */}
      <div className='from-background/0 via-background/60 to-background pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-b' />
    </div>
  );
}

export function GuildCardContainer({ guilds }: GuildCardContainerProps) {
  const [query] = useQueryState('q');
  const [debouncedQuery] = useDebounceValue(query, 300);

  if (!guilds.length) {
    return (
      <Empty className='border'>
        <EmptyHeader>
          <EmptyMedia>
            <StackedCardsIllustration />
          </EmptyMedia>
          <EmptyTitle>サーバーがありません</EmptyTitle>
          <EmptyDescription>まずはサーバーにnonibotを導入しましょう！</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            render={
              <a href='/api/invite'>
                <PlusIcon />
                サーバーを追加
              </a>
            }
            nativeButton={false}
          />
        </EmptyContent>
      </Empty>
    );
  }

  const filteredGuilds = guilds.filter(
    (guild) =>
      !debouncedQuery ||
      guild.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      guild.id === debouncedQuery,
  );

  if (!filteredGuilds.length) {
    return (
      <Empty className='border'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <SearchIcon />
          </EmptyMedia>
          <EmptyTitle>サーバーが見つかりませんでした</EmptyTitle>
          <EmptyDescription>
            検索条件 "{debouncedQuery}" に一致するサーバーが見つかりませんでした。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {filteredGuilds.map((guild) => (
        <GuildCard key={guild.id} guild={guild} />
      ))}
    </div>
  );
}
