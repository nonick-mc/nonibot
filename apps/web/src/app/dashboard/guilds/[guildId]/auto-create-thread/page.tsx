import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels } from '@/lib/discord/api';
import { sortChannels } from '@/lib/discord/utils';
import { CreateRuleDialog } from './_dialogs/create-rule-dialog';
import { RulesMaxSize } from './constants';
import { RuleList } from './rule-list';

export const metadata: Metadata = {
  title: '自動スレッド作成',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/auto-create-thread'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, rules] = await Promise.all([
    getChannels(guildId, { revalidate: 30 }),
    db.query.autoCreateThreadRule.findMany({
      where: (rule, { eq }) => eq(rule.guildId, guildId),
      orderBy: (rule, { asc }) => asc(rule.createdAt),
    }),
  ]);

  const sortedChannels = sortChannels(channels);

  return (
    <>
      <Header
        title='自動スレッド作成'
        description='指定したチャンネルにメッセージが投稿された際、自動でスレッドを作成します。'
      />
      <Card className='bg-card/50'>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='w-full flex flex-col gap-1.5'>
            <CardTitle>チャンネル一覧</CardTitle>
            <CardDescription>
              最大{RulesMaxSize}個のチャンネルを追加できます。（残り{RulesMaxSize - rules.length}
              個）
            </CardDescription>
          </div>
          <CreateRuleDialog channels={sortedChannels} rules={rules} />
        </CardHeader>
        <CardContent>
          <RuleList channels={sortedChannels} rules={rules} />
        </CardContent>
      </Card>
    </>
  );
}
