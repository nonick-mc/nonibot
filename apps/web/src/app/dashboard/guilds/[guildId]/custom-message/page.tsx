import type { Metadata } from 'next';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SendMessageForm } from './form';

export const metadata: Metadata = {
  title: 'カスタムメッセージ',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-message'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, emojis, roles] = await Promise.all([
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
  ]);

  return (
    <SendMessageForm channels={sortChannels(channels)} emojis={emojis} roles={sortRoles(roles)} />
  );
}
