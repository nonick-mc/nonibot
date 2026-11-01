import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomActionAllowedComponents } from '@/lib/custom-action';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { CreateDialog } from './create-dialog';
import { MessageList } from './message-list';
import { maxSavedMessages } from './schema';

export const metadata: Metadata = {
  title: 'カスタムメッセージ',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-message'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, emojis, roles, savedMessages, allowedComponents] = await Promise.all([
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
    db.query.customMessage.findMany({
      where: (message, { eq }) => eq(message.guildId, guildId),
      columns: { id: true, name: true, channelId: true, createdAt: true },
      orderBy: (message, { desc }) => desc(message.createdAt),
    }),
    getCustomActionAllowedComponents(guildId),
  ]);

  return (
    <>
      <Header
        title='カスタムメッセージ'
        description='サーバー内の任意のチャンネルにメッセージを送信します。'
      />
      <Card className='bg-card/50'>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='w-full flex flex-col gap-1.5'>
            <CardTitle>保存したメッセージ</CardTitle>
            <CardDescription>
              最大{maxSavedMessages}件のメッセージを保存できます。（残り
              {Math.max(maxSavedMessages - savedMessages.length, 0)}件）
            </CardDescription>
          </div>
          <CreateDialog
            channels={sortChannels(channels)}
            emojis={emojis}
            roles={sortRoles(roles)}
            allowedComponents={allowedComponents}
            isFull={savedMessages.length >= maxSavedMessages}
            names={savedMessages.map((m) => m.name)}
          >
            <Button>
              <PlusIcon />
              メッセージを送信する
            </Button>
          </CreateDialog>
        </CardHeader>
        <CardContent>
          <MessageList
            guildId={guildId}
            channels={sortChannels(channels)}
            messages={savedMessages}
          />
        </CardContent>
      </Card>
    </>
  );
}
