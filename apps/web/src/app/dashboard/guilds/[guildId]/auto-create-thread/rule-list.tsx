import type { autoCreateThreadRule } from '@repo/database';
import type { APIGuildChannel, GuildChannelType } from 'discord-api-types/v10';
import type { InferSelectModel } from 'drizzle-orm';
import { ChevronRightIcon, HashIcon, ListIcon, TriangleAlertIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/reui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';

type RuleListProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  rules: InferSelectModel<typeof autoCreateThreadRule>[];
};

export function RuleList({ channels, rules }: RuleListProps) {
  if (!rules.length) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <ListIcon />
          </EmptyMedia>
          <EmptyTitle>チャンネルがありません</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {rules.map((rule) => {
        const targetChannel = channels.find((channel) => channel.id === rule.channelId);
        const isTargetChannelAvailable = !!targetChannel;

        return (
          <Item
            variant='outline'
            key={rule.channelId}
            render={
              <Link
                href={
                  `/dashboard/guilds/${rule.guildId}/auto-create-thread/${rule.channelId}` as Route
                }
              />
            }
          >
            <ItemMedia>
              <HashIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle
                className={cn('inline-flex gap-3', {
                  'text-muted-foreground': !isTargetChannelAvailable,
                })}
              >
                {isTargetChannelAvailable ? (
                  targetChannel.name
                ) : (
                  <>
                    不明なチャンネル
                    <span className='inline-flex gap-1 text-warning text-xs'>
                      <TriangleAlertIcon className='size-4' />
                      対応が必要です
                    </span>
                  </>
                )}
              </ItemTitle>
              <div className='flex gap-2'>
                <Badge variant='outline'>
                  <span
                    className={cn('ms-px size-1.5 rounded-full bg-destructive', {
                      'bg-success': rule.enabled,
                    })}
                  />{' '}
                  {rule.enabled ? 'アクティブ' : '非アクティブ'}
                </Badge>
              </div>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className='size-4' />
            </ItemActions>
          </Item>
        );
      })}
    </div>
  );
}
