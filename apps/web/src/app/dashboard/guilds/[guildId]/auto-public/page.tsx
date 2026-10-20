import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: '自動アナウンス公開',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/auto-public'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, roles, setting] = await Promise.all([
    getChannels(guildId),
    getRoles(guildId),
    db.query.autoPublicSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='自動アナウンス公開'
        description='アナウンスチャンネルに投稿されたメッセージを自動で公開します。'
      />
      <SettingForm
        channels={sortChannels(channels)}
        roles={sortRoles(roles)}
        defaultValues={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
