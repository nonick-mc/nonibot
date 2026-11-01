import { NavbarBreadcrumb } from '../navbar-breadcrumb';

export default async function Page({ params }: PageProps<'/dashboard/guilds/[guildId]'>) {
  const { guildId } = await params;
  return <NavbarBreadcrumb guildId={guildId} segments={[]} />;
}
