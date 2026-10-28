import { collectInteractiveComponents, parseCustomActionCustomId } from '@repo/shared';
import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getChannels, getGuildEmojis, getRoles } from '@/lib/discord/api';
import { getCurrentAssignableRoleRules } from '@/lib/discord/assignable-role';
import { sortChannels, sortRoles } from '@/lib/discord/utils';
import { stepsSchema } from '../schema';
import { SettingForm } from './form';

export const metadata: Metadata = {
  title: 'カスタムアクション',
};

export default async function Page({
  params,
}: PageProps<'/dashboard/guilds/[guildId]/custom-action/[actionId]'>) {
  const { guildId, actionId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const [roles, channels, emojis, assignableRoleRules, action, messages] = await Promise.all([
    getRoles(guildId),
    getChannels(guildId),
    getGuildEmojis(guildId),
    getCurrentAssignableRoleRules(guildId),
    db.query.customAction.findFirst({
      where: (action, { and, eq }) => and(eq(action.guildId, guildId), eq(action.id, actionId)),
    }),
    db.query.customMessage.findMany({
      where: (message, { eq }) => eq(message.guildId, guildId),
      columns: { components: true },
    }),
  ]);

  if (!action) notFound();

  const usageCount = messages.filter(({ components }) =>
    collectInteractiveComponents(components).some(
      (c) => parseCustomActionCustomId(c.customId) === action.id,
    ),
  ).length;

  return (
    <>
      <Button
        render={<Link href={`/dashboard/guilds/${guildId}/custom-action`} />}
        className='w-fit mb-2'
        variant='outline'
      >
        <ArrowLeftIcon />
        一覧に戻る
      </Button>
      <Header
        title={`「${action.name}」の設定`}
        description='カスタムアクションの名前や動作を変更します。'
      />
      <SettingForm
        action={{
          id: action.id,
          name: action.name,
          steps: stepsSchema.safeParse(action.steps).data ?? [],
        }}
        roles={sortRoles(roles)}
        resources={{ roles: sortRoles(roles), channels: sortChannels(channels), emojis }}
        assignableRoleRules={assignableRoleRules}
        usageCount={usageCount}
      />
    </>
  );
}
