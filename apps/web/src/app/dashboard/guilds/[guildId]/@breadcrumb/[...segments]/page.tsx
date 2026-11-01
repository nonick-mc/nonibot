import { NavbarBreadcrumb } from '../../navbar-breadcrumb';

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/[...segments]'>) {
  const { guildId, segments } = await params;
  return <NavbarBreadcrumb guildId={guildId} segments={segments} />;
}
