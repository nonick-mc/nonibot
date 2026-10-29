import type { InternalApiChannel } from '@repo/shared/types';
import { cn } from 'cn';
import { ClockIcon, ListIcon, MessageSquareTextIcon, TriangleAlertIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { ChannelTypeIcon } from '@/components/discord/channel-type-icon';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { MessageMenu } from './message-menu';

type MessageListProps = {
  guildId: string;
  channels: InternalApiChannel[];
  messages: { id: string; name: string; channelId: string; createdAt: Date }[];
};

const dateFormat = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' });

export function MessageList({ guildId, channels, messages }: MessageListProps) {
  if (!messages.length) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <ListIcon />
          </EmptyMedia>
          <EmptyTitle>保存したメッセージがありません</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {messages.map((message) => {
        const channel = channels.find((ch) => ch.id === message.channelId);
        return (
          <Item
            variant='outline'
            key={message.id}
            className='relative transition-colors hover:not-has-[button:hover]:bg-muted'
          >
            <ItemMedia>
              <MessageSquareTextIcon strokeWidth={1.5} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                <Link
                  href={`/dashboard/guilds/${guildId}/custom-message/${message.id}` as Route}
                  className='outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50'
                >
                  {message.name}
                </Link>
              </ItemTitle>
              <div className='flex flex-col items-start gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center'>
                <span
                  className={cn('flex min-w-0 items-center gap-1', { 'text-warning': !channel })}
                >
                  {channel ? (
                    <ChannelTypeIcon type={channel.type} className='mt-0 size-3' />
                  ) : (
                    <TriangleAlertIcon className='size-3' />
                  )}
                  <span className='truncate'>{channel?.name ?? '不明なチャンネル'}</span>
                </span>
                <span aria-hidden='true' className='max-sm:hidden'>
                  ·
                </span>
                <span className='flex items-center gap-1'>
                  <ClockIcon className='size-3' />
                  {dateFormat.format(message.createdAt)}
                </span>
              </div>
            </ItemContent>
            <ItemActions>
              <MessageMenu id={message.id} name={message.name} />
            </ItemActions>
          </Item>
        );
      })}
    </div>
  );
}
