import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels } from '@/lib/discord/api';
import { sortChannels } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: '自動認証レベル変更',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/auto-change-verification-level'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, setting] = await Promise.all([
    getChannels(guildId),
    db.query.autoChangeVerifyLevelSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='自動認証レベル変更'
        description='サーバーの認証レベルを特定の時間帯だけ変更します。'
      />
      <SettingForm
        channels={sortChannels(channels)}
        defaultValues={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
