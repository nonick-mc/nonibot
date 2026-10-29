import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomActionAllowedComponents } from '@/lib/custom-action';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { MessageList } from './message-list';
import { editorFormSchema, maxSavedMessages } from './schema';

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
      columns: { id: true, name: true, channelId: true, components: true, createdAt: true },
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
          <Button
            render={<Link href={`/dashboard/guilds/${guildId}/custom-message/new`} />}
            nativeButton={false}
          >
            <PlusIcon />
            新規作成
          </Button>
        </CardHeader>
        <CardContent>
          <MessageList
            channels={sortChannels(channels)}
            emojis={emojis}
            roles={sortRoles(roles)}
            allowedComponents={allowedComponents}
            messages={savedMessages.map(({ components, ...message }) => {
              // スキーマに合わない値はcomponentsだけ空にする
              const parsed = editorFormSchema.shape.components.safeParse(components);
              return { ...message, components: parsed.success ? parsed.data : [] };
            })}
          />
        </CardContent>
      </Card>
    </>
  );
}
