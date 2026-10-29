import { auditLog, user } from '@repo/database';
import { SnowflakeRegex } from '@repo/shared/constants';
import { and, count, eq, inArray } from 'drizzle-orm';
import { InfoIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Card, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getUser } from '@/lib/discord/api';
import type { AuditLogAuthor } from './columns';
import { DataTable } from './data-table';
import { Filters } from './filters';

export const metadata: Metadata = {
  title: '監査ログ',
};

const pageSizes = [10, 25, 50];

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

async function fetchAuthor(discordUserId: string): Promise<AuditLogAuthor | null> {
  try {
    const u = await getUser(discordUserId);
    return {
      displayName: u.global_name ?? u.username,
      username: u.username,
      avatarUrl: u.avatar_url,
    };
  } catch {
    return null;
  }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<'/dashboard/guilds/[guildId]/audit-log'>) {
  const { guildId } = await params;
  await verifyDashboardAccessPermission(guildId);

  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const requestedSize = Number(query.pageSize);
  const pageSize = pageSizes.includes(requestedSize) ? requestedSize : pageSizes[0];

  const users = toArray(query.user).filter((v) => SnowflakeRegex.test(v));
  const targets = toArray(query.target).filter((v) =>
    (auditLog.targetName.enumValues as string[]).includes(v),
  ) as (typeof auditLog.targetName.enumValues)[number][];
  const actions = toArray(query.action).filter((v) =>
    (auditLog.actionType.enumValues as string[]).includes(v),
  ) as (typeof auditLog.actionType.enumValues)[number][];

  const where = and(
    eq(auditLog.guildId, guildId),
    users.length
      ? inArray(
          auditLog.authorId,
          db.select({ id: user.id }).from(user).where(inArray(user.discordUserId, users)),
        )
      : undefined,
    targets.length ? inArray(auditLog.targetName, targets) : undefined,
    actions.length ? inArray(auditLog.actionType, actions) : undefined,
  );

  const [logs, [{ total }], authors] = await Promise.all([
    db.query.auditLog.findMany({
      where,
      orderBy: (log, { desc }) => [desc(log.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      with: { author: { columns: { discordUserId: true } } },
    }),
    db.select({ total: count() }).from(auditLog).where(where),
    db
      .selectDistinct({ discordUserId: user.discordUserId })
      .from(auditLog)
      .innerJoin(user, eq(auditLog.authorId, user.id))
      .where(eq(auditLog.guildId, guildId)),
  ]);

  const discordUserIds = [...new Set(authors.map((a) => a.discordUserId))];
  const fetched = await Promise.all(discordUserIds.map(fetchAuthor));
  const authorMap = new Map(discordUserIds.map((id, i) => [id, fetched[i]]));

  const rows = logs.map(({ authorId: _, author, ...log }) => ({
    ...log,
    author: author ? (authorMap.get(author.discordUserId) ?? null) : null,
  }));

  return (
    <>
      <Header
        title='監査ログ'
        description='ユーザーがダッシュボードで加えた変更を閲覧することができます。'
      />
      <Alert variant='info'>
        <InfoIcon />
        <AlertTitle>この機能はベータ版です。</AlertTitle>
        <AlertDescription>
          この機能は開発中です。搭載している内容について予告なく変更する場合があります。
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <Filters
            users={authors.map((a) => ({
              id: a.discordUserId,
              author: authorMap.get(a.discordUserId) ?? null,
            }))}
          />
        </CardHeader>
        <Separator />
        <DataTable data={rows} total={total} page={page} pageSize={pageSize} />
      </Card>
    </>
  );
}
