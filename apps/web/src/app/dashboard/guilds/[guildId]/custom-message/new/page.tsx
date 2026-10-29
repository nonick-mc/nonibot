import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCustomActionAllowedComponents } from '@/lib/custom-action';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { maxSavedMessages } from '../schema';
import { SendMessageForm } from './form';

export const metadata: Metadata = {
  title: '新規作成 | カスタムメッセージ',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-message/new'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, emojis, roles, saved, allowedComponents] = await Promise.all([
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
    db.query.customMessage.findMany({
      where: (message, { eq }) => eq(message.guildId, guildId),
      columns: { id: true },
    }),
    getCustomActionAllowedComponents(guildId),
  ]);

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
      <SendMessageForm
        channels={sortChannels(channels)}
        emojis={emojis}
        roles={sortRoles(roles)}
        allowedComponents={allowedComponents}
        isFull={saved.length >= maxSavedMessages}
      />
    </>
  );
}
