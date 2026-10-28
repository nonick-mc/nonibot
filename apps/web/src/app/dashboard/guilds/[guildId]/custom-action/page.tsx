import { collectInteractiveComponents, parseCustomActionCustomId } from '@repo/shared';
import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getRoles } from '@/lib/discord/api';
import { ActionList } from './action-list';
import { CreateDialog } from './create-dialog';
import { maxCustomActions } from './schema';

export const metadata: Metadata = {
  title: 'カスタムアクション',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-action'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [roles, actions, messages] = await Promise.all([
    getRoles(guildId),
    db.query.customAction.findMany({
      where: (action, { eq }) => eq(action.guildId, guildId),
      orderBy: (action, { desc }) => desc(action.createdAt),
    }),
    db.query.customMessage.findMany({
      where: (message, { eq }) => eq(message.guildId, guildId),
      columns: { components: true },
    }),
  ]);

  // アクションを使用している保存済みメッセージの件数
  const usage: Record<string, number> = {};
  for (const { components } of messages) {
    const ids = new Set(
      collectInteractiveComponents(components).flatMap(
        (c) => parseCustomActionCustomId(c.customId) ?? [],
      ),
    );
    for (const id of ids) usage[id] = (usage[id] ?? 0) + 1;
  }

  return (
    <>
      <Header
        title='カスタムアクション'
        description='ボタンを押したときに実行するアクションを管理します。'
      />
      <Card className='bg-card/50'>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='w-full flex flex-col gap-1.5'>
            <CardTitle>登録したアクション</CardTitle>
            <CardDescription>
              最大{maxCustomActions}個のアクションを作成できます。（残り
              {Math.max(maxCustomActions - actions.length, 0)}個）
            </CardDescription>
          </div>
          <CreateDialog>
            <Button disabled={actions.length >= maxCustomActions}>
              <PlusIcon />
              アクションを作成する
            </Button>
          </CreateDialog>
        </CardHeader>
        <CardContent>
          <ActionList guildId={guildId} actions={actions} roles={roles} usage={usage} />
        </CardContent>
      </Card>
    </>
  );
}
