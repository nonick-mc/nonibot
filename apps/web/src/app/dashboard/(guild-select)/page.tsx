import type { Metadata } from 'next';
import { Suspense } from 'react';
import { verifySession } from '@/lib/dal';
import { getManageableGuilds } from '@/lib/discord/api';
import { getInviteUrl } from '@/lib/discord/invite';
import { GuildCardContainer } from './guild-card-container';

export const metadata: Metadata = {
  title: 'サーバー選択',
};

export default async function Page() {
  await verifySession();
  const guilds = await getManageableGuilds();

  return (
    <Suspense>
      <GuildCardContainer guilds={guilds} inviteUrl={getInviteUrl()} />
    </Suspense>
  );
}
