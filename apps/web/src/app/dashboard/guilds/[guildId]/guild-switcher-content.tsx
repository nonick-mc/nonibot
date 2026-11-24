'use client';

import type { ComponentProps } from 'react';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';

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
