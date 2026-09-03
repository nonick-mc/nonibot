import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { formSchema as banFormSchema } from './ban/schema';
import { formSchema as kickFormSchema } from './kick/schema';
import { LogAccordion } from './log-accordion';
import { formSchema as messageDeleteFormSchema } from './message-delete/schema';
import { formSchema as messageEditFormSchema } from './message-edit/schema';
import { formSchema as timeoutFormSchema } from './timeout/schema';
import { formSchema as voiceFormSchema } from './voice/schema';

export const metadata: Metadata = {
  title: 'イベントログ',
};

export default async function Page({ params }: PageProps<'/dashboard/guilds/[guildId]/event-log'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, roles, ban, kick, timeout, voice, messageDelete, messageEdit] =
    await Promise.all([
      getChannels(guildId, { revalidate: 30 }),
      getRoles(guildId, { revalidate: 30 }),
      db.query.banLogSetting.findFirst({
        where: (setting, { eq }) => eq(setting.guildId, guildId),
      }),
      db.query.kickLogSetting.findFirst({
        where: (setting, { eq }) => eq(setting.guildId, guildId),
      }),
      db.query.timeoutLogSetting.findFirst({
        where: (setting, { eq }) => eq(setting.guildId, guildId),
      }),
      db.query.voiceLogSetting.findFirst({
        where: (setting, { eq }) => eq(setting.guildId, guildId),
      }),
      db.query.msgDeleteLogSetting.findFirst({
        where: (setting, { eq }) => eq(setting.guildId, guildId),
      }),
      db.query.msgEditLogSetting.findFirst({
        where: (setting, { eq }) => eq(setting.guildId, guildId),
      }),
    ]);

  const sorted = sortChannels(channels);

  return (
    <>
      <Header
        title='イベントログ'
        description='サーバー内の出来事をチャンネルにログとして送信します。'
      />
      <LogAccordion
        channels={sorted}
        roles={sortRoles(roles)}
        defaultValues={{
          ban: banFormSchema.safeParse(ban ?? {}).data,
          kick: kickFormSchema.safeParse(kick ?? {}).data,
          timeout: timeoutFormSchema.safeParse(timeout ?? {}).data,
          voice: voiceFormSchema.safeParse(voice ?? {}).data,
          'message-delete': messageDeleteFormSchema.safeParse(messageDelete ?? {}).data,
          'message-edit': messageEditFormSchema.safeParse(messageEdit ?? {}).data,
        }}
      />
    </>
  );
}
