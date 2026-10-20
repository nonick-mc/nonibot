import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CardContent } from '@/components/ui/card';
import {
  canAccessVerifyPage,
  getCachedSession,
  getVerificationSetting,
  isAvailableVerifyPage,
} from '@/lib/dal';
import { getGuild, getGuildMember } from '@/lib/discord/api';
import { VerificationHeader } from './header';
import { VerificationWizard } from './wizard';

export const metadata: Metadata = {
  title: 'メンバー認証',
};

export default async function Page({ params }: PageProps<'/verify/guilds/[guildId]'>) {
  const { guildId } = await params;

  if (!(await isAvailableVerifyPage(guildId)) || !(await canAccessVerifyPage(guildId))) {
    notFound();
  }

  const session = await getCachedSession();
  const [guild, member, setting] = await Promise.all([
    getGuild(guildId),
    getGuildMember(guildId, session?.user.discordUserId as string),
    getVerificationSetting(guildId),
  ]);

  return (
    <>
      <VerificationHeader />
      <CardContent>
        <VerificationWizard
          guild={guild}
          isVerified={!!setting?.role && member.roles.includes(setting.role)}
        />
      </CardContent>
    </>
  );
}
