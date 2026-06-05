import Link from 'next/link';
import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { GuildSwitcher } from './guild-switcher';
import { SidebarNavigation } from './sidebar-navigation';

type AppSidebarProps = {
  guildId: string;
};

export function AppSidebar({ guildId }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className='pt-0'>
        <div className='h-16 flex items-center'>
          <Link href='/dashboard'>
            <Logo height={17} />
          </Link>
        </div>
        <Suspense fallback={<Skeleton className='h-12' />}>
          <GuildSwitcher currentGuildId={guildId} />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation />
      </SidebarContent>
    </Sidebar>
  );
}
