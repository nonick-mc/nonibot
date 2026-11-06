import { featurePermissions, Links } from '@repo/shared/constants';
import { ExternalLinkIcon, FlaskConicalIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MissingPermissionAlert } from '@/components/discord/missing-permission-alert';
import { Header } from '@/components/header';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Button } from '@/components/ui/button';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { SettingForm } from './form';
import { formSchema } from './schema';

export const metadata: Metadata = {
  title: 'レベルシステム',
};

export default async function Page({ params }: PageProps<'/dashboard/guilds/[guildId]/level'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [channels, emojis, roles, setting] = await Promise.all([
    getChannels(guildId),
    getGuildEmojis(guildId),
    getRoles(guildId),
    db.query.levelSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    }),
  ]);

  return (
    <>
      <Header
        title='レベルシステム'
        description='メッセージを送信したメンバーに経験値を付与します。'
      />
      <MissingPermissionAlert guildId={guildId} permissions={featurePermissions.level} />
      <Alert variant='info'>
        <FlaskConicalIcon />
        <AlertTitle>この機能はベータ版です。</AlertTitle>
        <AlertDescription>
          開発中につき、予告なく仕様が変更される場合があります。最新の情報はサポートサーバーをご確認ください。
        </AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            nativeButton={false}
            render={<Link href={Links.SupportServer} target='_blank' />}
          >
            サポートサーバー
            <ExternalLinkIcon />
          </Button>
        </AlertAction>
      </Alert>
      <SettingForm
        channels={sortChannels(channels)}
        emojis={emojis}
        roles={sortRoles(roles)}
        setting={formSchema.safeParse(setting ?? {}).data}
      />
    </>
  );
}
