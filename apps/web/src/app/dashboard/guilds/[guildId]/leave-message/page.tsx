import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: '退室メッセージ',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/leave-message'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, emojis, roles, setting] = await Promise.all([
    getChannels(guildId, { revalidate: 30 }),
    getGuildEmojis(guildId, { revalidate: 30 }),
    getRoles(guildId, { revalidate: 30 }),
    db.query.leaveMessageSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='退室メッセージ'
        description='サーバーからユーザーが退室した際にメッセージを送信します。'
      />
      <SettingForm
        channels={sortChannels(channels)}
        emojis={emojis}
        roles={sortRoles(roles)}
        defaultValues={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
