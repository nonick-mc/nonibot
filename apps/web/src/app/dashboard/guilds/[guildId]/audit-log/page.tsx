import { auditLog } from '@repo/database';
import { count, eq } from 'drizzle-orm';
import { InfoIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { verifyDashboardAccessPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { DataTable } from './data-table';

export const metadata: Metadata = {
  title: '監査ログ',
};

const pageSizes = [10, 25, 50];

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

  const [logs, [{ total }]] = await Promise.all([
    db.query.auditLog.findMany({
      where: (log, { eq }) => eq(log.guildId, guildId),
      orderBy: (log, { desc }) => [desc(log.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      columns: { authorId: false },
      with: { author: { columns: { name: true, globalName: true, image: true } } },
    }),
    db.select({ total: count() }).from(auditLog).where(eq(auditLog.guildId, guildId)),
  ]);

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
      <DataTable data={logs} total={total} page={page} pageSize={pageSize} />
    </>
  );
}
