import { ArrowLeftIcon, TriangleAlertIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Button } from '@/components/ui/button';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { updateRuleFormSchema } from '../schema';
import { SettingForm } from './form';

export const metadata: Metadata = {
  title: '自動スレッド作成',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/auto-create-thread/[channelId]'>) {
  const { guildId, channelId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, roles, emojis, rule] = await Promise.all([
    getChannels(guildId, { revalidate: 30 }),
    getRoles(guildId, { revalidate: 30 }),
    getGuildEmojis(guildId, { revalidate: 30 }),
    db.query.autoCreateThreadRule.findFirst({
      where: (rule, { eq, and }) => and(eq(rule.guildId, guildId), eq(rule.channelId, channelId)),
    }),
  ]);

  if (!rule) notFound();

  const targetChannel = channels.find((channel) => channel.id === channelId);
  const targetChannelName = targetChannel?.name ?? '不明なチャンネル';

  return (
    <>
      <Button
        render={<Link href={`/dashboard/guilds/${guildId}/auto-create-thread`} />}
        className='w-fit mb-2'
        variant='outline'
      >
        <ArrowLeftIcon />
        一覧に戻る
      </Button>
      <Header
        title={`「#${targetChannelName}」の設定`}
        description='自動スレッド作成の動作を変更します。'
      />
      {!targetChannel && (
        <Alert variant='warning'>
          <TriangleAlertIcon />
          <AlertTitle>チャンネルの情報を取得できませんでした</AlertTitle>
          <AlertDescription>
            これは通常、サーバーからチャンネルが削除されている場合や、nonibotがこのチャンネルの閲覧権限を所持していない場合に発生します。
          </AlertDescription>
        </Alert>
      )}
      <SettingForm
        targetChannelName={targetChannelName}
        roles={sortRoles(roles)}
        channels={sortChannels(channels)}
        emojis={emojis}
        rule={rule}
        defaultValues={
          updateRuleFormSchema.safeParse({
            ...rule,
            messageComponents: rule.messageComponents.length ? rule.messageComponents : undefined,
          }).data
        }
        disabled={!targetChannel}
      />
    </>
  );
}
