import { cookies } from 'next/headers';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { verifyDashboardAccessPermission } from '@/lib/dal';
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

  const featureStatuses = await getFeatureStatuses(guildId);
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar guildId={guildId} featureStatuses={featureStatuses} />
      <SidebarInset>
        <Navbar breadcrumb={breadcrumb} />
        <div className='flex-1 max-w-300 w-full mx-auto p-6 flex flex-col gap-6'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
