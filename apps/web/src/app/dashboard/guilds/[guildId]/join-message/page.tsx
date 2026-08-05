import { GuildFeature } from 'discord-api-types/v10';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuild, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: '入室メッセージ',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/join-message'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, guild, emojis, roles, setting] = await Promise.all([
    getChannels(guildId, { revalidate: 30 }),
    getGuild(guildId),
    getGuildEmojis(guildId, { revalidate: 30 }),
    getRoles(guildId, { revalidate: 30 }),
    db.query.joinMessageSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  const normalizedSetting = setting && {
    ...setting,
    messageComponents: setting.messageComponents.length ? setting.messageComponents : undefined,
    dmMessageComponents: setting.dmMessageComponents.length
      ? setting.dmMessageComponents
      : undefined,
  };

  return (
    <>
      <Header
        title='入室メッセージ'
        description='サーバーにユーザーが参加した際にメッセージを送信します。'
      />
      <SettingForm
        channels={sortChannels(channels)}
        emojis={emojis}
        roles={sortRoles(roles)}
        setting={formSchema.safeParse(normalizedSetting ?? {}).data}
        enabledVerificationGate={guild.features.includes(
          GuildFeature.MemberVerificationGateEnabled,
        )}
      />
    </>
  );
}
