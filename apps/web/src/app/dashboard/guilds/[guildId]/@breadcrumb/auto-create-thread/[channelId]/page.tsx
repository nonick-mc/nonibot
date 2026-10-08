import { verifyDashboardAccessPermission } from '@/lib/dal';
import { getChannels } from '@/lib/discord/api';
import { NavbarBreadcrumb } from '../../../navbar-breadcrumb';

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/auto-create-thread/[channelId]'>) {
  const { guildId, channelId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const channels = await getChannels(guildId, { revalidate: 30 });
  const channel = channels.find((channel) => channel.id === channelId);

  return (
    <NavbarBreadcrumb
      guildId={guildId}
      segments={['auto-create-thread', channelId]}
      current={channel ? `#${channel.name}` : '不明なチャンネル'}
    />
  );
}
