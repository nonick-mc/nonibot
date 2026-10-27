import { NavbarBreadcrumb } from '../../../navbar-breadcrumb';

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-message/new'>) {
  const { guildId } = await params;
  return <NavbarBreadcrumb guildId={guildId} segments={['custom-message']} current='新規作成' />;
}
