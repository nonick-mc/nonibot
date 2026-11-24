import Link from 'next/link';
import { Suspense } from 'react';
import { Logo, LogoIcon } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { GuildSwitcher } from './guild-switcher';
import { SidebarNavigation } from './sidebar-navigation';

type AppSidebarProps = {
  guildId: string;
  featureStatuses: Record<string, boolean>;
};

export function AppSidebar({ guildId, featureStatuses }: AppSidebarProps) {
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='pt-0'>
        <div className='h-14 flex items-center group-data-[collapsible=icon]:justify-center'>
          <Link href='/dashboard'>
            <Logo height={18} className='group-data-[collapsible=icon]:hidden' />
            <LogoIcon height={22} className='hidden group-data-[collapsible=icon]:block' />
          </Link>
        </div>
        <Suspense fallback={<Skeleton className='h-12 group-data-[collapsible=icon]:size-8' />}>
          <GuildSwitcher currentGuildId={guildId} />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation featureStatuses={featureStatuses} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
