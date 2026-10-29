import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { z } from 'zod';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getCustomActionAllowedComponents } from '@/lib/custom-action';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import type { editorFormSchema } from '../schema';
import { SettingForm } from './form';

export const metadata: Metadata = {
  title: 'カスタムメッセージ',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-message/[messageId]'>) {
  const { guildId, messageId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, emojis, roles, allowedComponents, message] = await Promise.all([
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
    getCustomActionAllowedComponents(guildId),
    db.query.customMessage.findFirst({
      where: (message, { and, eq }) => and(eq(message.guildId, guildId), eq(message.id, messageId)),
      columns: { id: true, name: true, channelId: true, components: true },
    }),
  ]);

  if (!message) notFound();

  return (
    <>
      <Button
        render={<Link href={`/dashboard/guilds/${guildId}/custom-message`} />}
        nativeButton={false}
        className='w-fit mb-2'
        variant='outline'
      >
        <ArrowLeftIcon />
        一覧に戻る
      </Button>
      <Header
        title={`「${message.name}」の設定`}
        description='保存したメッセージの名前や内容を変更します。'
      />
      <SettingForm
        message={{
          id: message.id,
          name: message.name,
          // 削除されたアクションを使うボタンなど、検証に通らない値もそのまま編集できるよう、検証せずに渡す
          components: message.components as z.input<typeof editorFormSchema>['components'],
        }}
        channels={sortChannels(channels)}
        emojis={emojis}
        roles={sortRoles(roles)}
        allowedComponents={allowedComponents}
      />
    </>
  );
}
