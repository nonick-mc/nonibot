import { HashIcon, Link2Icon, MilestoneIcon, TextSearchIcon } from 'lucide-react';
import type { CSSProperties, PropsWithChildren } from 'react';
import { useContext } from 'react';
import { cn } from '@/lib/utils';
import { ChannelTypeIcon } from '../channel-type-icon';
import { DiscordMessageContext } from '../message-context';
import { toHexColor } from '../role-color';

type MentionProps = PropsWithChildren<{
  color?: string;
  textGradient?: string[];
}>;

export function Mention({ color, textGradient, children }: MentionProps) {
  if (color) {
    return (
      <span
        style={{ '--mention-color': color } as CSSProperties}
        className={cn(
          'inline-flex items-center align-bottom gap-0.5 cursor-pointer rounded px-0.5 transition-colors',
          '[&_svg]:mt-0.5 [&_svg]:size-[1em]',
          'bg-(--mention-color)/10 hover:bg-(--mention-color)/30',
          !textGradient && 'text-(--mention-color)',
        )}
      >
        {textGradient ? (
          <span
            className='bg-clip-text text-transparent'
            style={{ backgroundImage: `linear-gradient(135deg, ${textGradient.join(', ')})` }}
          >
            {children}
          </span>
        ) : (
          children
        )}
      </span>
    );
  }

  return (
    <span className='inline-flex items-center align-bottom gap-0.5 cursor-pointer rounded px-0.5 transition-colors bg-discord-primary/10 text-[#4752c4] hover:bg-discord-primary hover:text-white dark:bg-discord-primary/30 dark:text-[#c9cdfb] dark:hover:bg-discord-primary dark:hover:text-white [&_svg]:mt-0.5 [&_svg]:size-[1em]'>
      {children}
    </span>
  );
}

type GuildNavigationMentionProps = {
  variant: 'customize' | 'browse' | 'guide' | 'linked-roles';
};

export function GuildNavigationMention({ variant }: GuildNavigationMentionProps) {
  switch (variant) {
    case 'customize':
      return (
        <Mention>
          <TextSearchIcon />
          チャンネル&ロール
        </Mention>
      );
    case 'browse':
      return (
        <Mention>
          <TextSearchIcon />
          チャンネル一覧
        </Mention>
      );
    case 'guide':
      return (
        <Mention>
          <MilestoneIcon />
          サーバーガイド
        </Mention>
      );
    case 'linked-roles':
      return (
        <Mention>
          <Link2Icon className='-rotate-45' />
          連携ロール
        </Mention>
      );
  }
}

export function ChannelMention({ id }: { id: string }) {
  const { channels = [] } = useContext(DiscordMessageContext);
  const channel = channels.find((c) => c.id === id);

  if (!channel) {
    return (
      <Mention>
        <HashIcon />
        チャンネル
      </Mention>
    );
  }

  return (
    <Mention>
      <ChannelTypeIcon type={channel.type} className='text-current! hover:text-current!' />
      {channel.name}
    </Mention>
  );
}

export function RoleMention({ id }: { id: string }) {
  const { roles = [] } = useContext(DiscordMessageContext);
  const role = roles.find((r) => r.id === id);

  if (!role) return <Mention>@ロール</Mention>;

  const { primary_color, secondary_color, tertiary_color } = role.colors;
  if (primary_color === 0) return <Mention>@{role.name}</Mention>;

  const stops = [primary_color, secondary_color, tertiary_color]
    .filter((c): c is number => c !== null)
    .map(toHexColor);

  return (
    <Mention color={toHexColor(primary_color)} textGradient={stops.length > 1 ? stops : undefined}>
      @{role.name}
    </Mention>
  );
}
