import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: 'サーバー内通報',
};

export default async function Page({ params }: PageProps<'/dashboard/guilds/[guildId]/report'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, roles, setting] = await Promise.all([
    getChannels(guildId, { revalidate: 30 }),
    getRoles(guildId, { revalidate: 30 }),
    db.query.reportSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='サーバー内通報'
        description='不適切なメッセージやユーザーをメンバーが通報できるようにします。'
      />
      <SettingForm
        channels={sortChannels(channels)}
        roles={sortRoles(roles)}
        defaultValues={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
