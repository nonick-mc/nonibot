import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { NavbarBreadcrumb } from '../../../navbar-breadcrumb';

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-message/[messageId]'>) {
  const { guildId, messageId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const message = await db.query.customMessage.findFirst({
    where: (message, { and, eq }) => and(eq(message.guildId, guildId), eq(message.id, messageId)),
    columns: { name: true },
  });

  return (
    <NavbarBreadcrumb
      guildId={guildId}
      segments={['custom-message', messageId]}
      current={message?.name ?? '不明なメッセージ'}
    />
  );
}
