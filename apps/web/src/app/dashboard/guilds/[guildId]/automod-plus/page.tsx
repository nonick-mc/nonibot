import { featurePermissions } from '@repo/shared/constants';
import type { Metadata } from 'next';
import { MissingPermissionAlert } from '@/components/discord/missing-permission-alert';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: 'AutoMod Plus',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/automod-plus'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, roles, setting] = await Promise.all([
    getChannels(guildId),
    getRoles(guildId),
    db.query.autoModSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='AutoMod Plus'
        description='設定したフィルターに検知されたメッセージを自動で削除します。'
      />
      <MissingPermissionAlert guildId={guildId} permissions={featurePermissions.automodPlus} />
      <SettingForm
        channels={sortChannels(channels)}
        roles={sortRoles(roles)}
        defaultValues={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
