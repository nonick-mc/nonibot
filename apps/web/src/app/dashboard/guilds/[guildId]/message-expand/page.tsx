import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels } from '@/lib/discord/api';
import { sortChannels } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: 'メッセージURL展開',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/message-expand'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, setting] = await Promise.all([
    getChannels(guildId),
    db.query.msgExpandSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='メッセージURL展開'
        description='DiscordのメッセージURLが送信された際に、そのメッセージの内容を追加で送信します。'
      />
      <SettingForm
        channels={sortChannels(channels)}
        defaultValues={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
