import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getFeatureStatuses } from '../feature-status';
import { FeatureTabs } from './feature-tabs';
import { GuildInfoCard, GuildInfoCardSkeleton } from './guild-info-card';

export const metadata: Metadata = {
  title: 'ダッシュボード',
};

export default async function Page({ params }: PageProps<'/dashboard/guilds/[guildId]'>) {
  const { guildId } = await params;
  const featureStatuses = await getFeatureStatuses(guildId);

  return (
    <>
      <Suspense fallback={<GuildInfoCardSkeleton />}>
        <GuildInfoCard guildId={guildId} />
      </Suspense>
      <FeatureTabs guildId={guildId} featureStatuses={featureStatuses} />
    </>
  );
}
