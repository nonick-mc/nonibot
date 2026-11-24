import { cookies } from 'next/headers';
import { CurrentGuildProvider } from '@/components/discord/current-guild';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { getGuild } from '@/lib/discord/api';
import { AppSidebar } from './app-sidebar';
import { getFeatureStatuses } from './feature-status';
import { Navbar } from './navbar';

export default async function Layout({
  params,
  children,
  breadcrumb,
}: LayoutProps<'/dashboard/guilds/[guildId]'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [featureStatuses, guild] = await Promise.all([
    getFeatureStatuses(guildId),
    getGuild(guildId).catch(() => null),
  ]);
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar guildId={guildId} featureStatuses={featureStatuses} />
      <SidebarInset>
        <Navbar breadcrumb={breadcrumb} />
        <div className='flex-1 max-w-300 w-full mx-auto p-6 flex flex-col gap-6'>
          <CurrentGuildProvider
            guild={guild && { id: guild.id, name: guild.name, icon: guild.icon }}
          >
            {children}
          </CurrentGuildProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
