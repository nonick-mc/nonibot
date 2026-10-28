import type { Metadata } from 'next';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { getCurrentRoleButtonRules } from '@/lib/discord/role-button';
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

  const [channels, emojis, roles, saved, roleButtonRules] = await Promise.all([
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
    db.query.customMessage.findMany({
      where: (message, { eq }) => eq(message.guildId, guildId),
      columns: { id: true },
    }),
    getCurrentRoleButtonRules(guildId),
  ]);

  return (
    <SendMessageForm
      channels={sortChannels(channels)}
      emojis={emojis}
      roles={sortRoles(roles)}
      roleButton={roleButtonRules ?? undefined}
      isFull={saved.length >= maxSavedMessages}
    />
  );
}
