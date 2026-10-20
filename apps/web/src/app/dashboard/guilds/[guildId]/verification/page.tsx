import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuild, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: 'メンバー認証',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/verification'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [guild, channels, emojis, roles, setting] = await Promise.all([
    getGuild(guildId),
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
    db.query.verificationSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header title='メンバー認証' description='特定の認証を行ったユーザーにロールを付与します。' />
      <SettingForm
        channels={sortChannels(channels)}
        emojis={emojis}
        roles={sortRoles(roles)}
        botHighestRolePosition={guild.bot_highest_role_position}
        setting={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
