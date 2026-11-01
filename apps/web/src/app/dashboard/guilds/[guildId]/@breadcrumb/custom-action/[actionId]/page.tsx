import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { NavbarBreadcrumb } from '../../../navbar-breadcrumb';

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-action/[actionId]'>) {
  const { guildId, actionId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const action = await db.query.customAction.findFirst({
    where: (action, { and, eq }) => and(eq(action.guildId, guildId), eq(action.id, actionId)),
    columns: { name: true },
  });

  return (
    <NavbarBreadcrumb
      guildId={guildId}
      segments={['custom-action', actionId]}
      current={action?.name ?? '不明なアクション'}
    />
  );
}
