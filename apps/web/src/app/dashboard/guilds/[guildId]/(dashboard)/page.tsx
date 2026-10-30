import type { Metadata } from 'next';
import { getFeatureStatuses } from '../feature-status';
import { FeatureTabs } from './feature-tabs';
import { GuildInfoCard } from './guild-info-card';

export const metadata: Metadata = {
  title: 'ダッシュボード',
};

export default async function Page({ params }: PageProps<'/dashboard/guilds/[guildId]'>) {
  const { guildId } = await params;
  const featureStatuses = await getFeatureStatuses(guildId);

  return (
    <>
      <GuildInfoCard guildId={guildId} />
      <FeatureTabs guildId={guildId} featureStatuses={featureStatuses} />
    </>
  );
}
