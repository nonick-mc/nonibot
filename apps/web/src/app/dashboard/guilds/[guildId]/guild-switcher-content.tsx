'use client';

import type { ComponentProps } from 'react';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';

// shadcn の sidebar-07 (team-switcher) と同様、デスクトップではサイドバーの右側に開く
export function GuildSwitcherContent(props: ComponentProps<typeof DropdownMenuContent>) {
  const { isMobile } = useSidebar();

  return (
    <DropdownMenuContent
      className='w-(--anchor-width) min-w-56'
      align='start'
      side={isMobile ? 'bottom' : 'right'}
      sideOffset={4}
      {...props}
    />
  );
}
