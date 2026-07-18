import { Link2Icon, MilestoneIcon, TextSearchIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export function Mention({ children }: PropsWithChildren) {
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
