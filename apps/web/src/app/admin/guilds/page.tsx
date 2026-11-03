import { BetterFetchError } from '@better-fetch/fetch';
import { guild } from '@repo/database';
import { count, desc, like, type SQL, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { verifyAdminPermission } from '@/lib/dal';
import { db } from '@/lib/db';
import { getGuildSummaries, getUser } from '@/lib/discord/api';
import type { AdminGuildRow, GuildOwner } from './columns';
import { DataTable } from './data-table';
import { Search } from './search';

export const metadata: Metadata = {
  title: '導入サーバー',
};

const PageSizes = [10, 25, 50];

async function fetchOwner(userId: string): Promise<GuildOwner | null> {
  try {
    const u = await getUser(userId);
    return {
      displayName: u.global_name ?? u.username,
      username: u.username,
      avatarUrl: u.avatar_url,
    };
  } catch (error) {
    if (!(error instanceof BetterFetchError && error.status === 404)) {
      console.error('サーバーのオーナーの取得に失敗しました', error);
    }
    return null;
  }
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function Page({ searchParams }: PageProps<'/admin/guilds'>) {
  await verifyAdminPermission();

  const query = await searchParams;
  const requestedSize = Number(first(query.pageSize));
  const pageSize = PageSizes.includes(requestedSize) ? requestedSize : PageSizes[0];
  const q = first(query.q)?.trim() ?? '';

  // 検索はサーバーIDの部分一致のみ。数字以外を含む入力は0件にする
  const where = !q ? undefined : /^\d+$/.test(q) ? like(guild.id, `%${q}%`) : sql`false`;

  // break-ui: 開発時のみ、`?data=`で最悪ケースのデータに差し替える。
  const isDev = process.env.NODE_ENV === 'development';
  const devFixture = isDev ? await import('./worst-case') : null;
  const devMode = (['worst', 'empty', 'one'] as const).find((m) => m === first(query.data));
  const DevDataToggle = isDev
    ? (await import('@/app/dashboard/guilds/[guildId]/audit-log/dev-data-toggle')).DevDataToggle
    : null;
  const worst = devFixture && devMode ? devFixture.getWorstCase(devMode) : null;

  const countGuilds = (condition?: SQL) =>
    db
      .select({ n: count() })
      .from(guild)
      .where(condition)
      .then(([r]) => r.n);
  const allTotal = worst?.allTotal ?? (await countGuilds());
  const total = worst?.total ?? (where ? await countGuilds(where) : allTotal);

  // 範囲外・巨大なページ番号は、最後のページに収める
  const requestedPage = Number(first(query.page));
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1
      ? Math.min(requestedPage, lastPage)
      : 1;

  let rows: AdminGuildRow[];
  if (worst) {
    rows = worst.rows;
  } else {
    const dbRows = await db
      .select({ id: guild.id, createdAt: guild.createdAt })
      .from(guild)
      .where(where)
      .orderBy(desc(guild.createdAt), desc(guild.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Botが取得できなかった場合も、IDと追加日時だけで一覧を表示する
    const summaries = dbRows.length
      ? await getGuildSummaries(dbRows.map((r) => r.id)).catch((error) => {
          console.error('サーバー情報の取得に失敗しました', error);
          return [];
        })
      : [];
    const summaryMap = new Map(summaries.map((s) => [s.id, s]));

    const ownerIds = [...new Set(summaries.map((s) => s.owner_id))];
    const fetchedOwners = await Promise.all(ownerIds.map(fetchOwner));
    const ownerMap = new Map(ownerIds.map((id, i) => [id, fetchedOwners[i]]));

    rows = dbRows.map((r) => {
      const summary = summaryMap.get(r.id) ?? null;
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        summary,
        owner: summary ? (ownerMap.get(summary.owner_id) ?? null) : null,
      };
    });
  }

  return (
    <>
      <Header
        title='導入サーバー'
        description='Botを導入しているサーバーの一覧を閲覧することができます。'
      />
      <Card className='bg-card/50'>
        <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col'>
            <span className='text-muted-foreground text-sm'>導入数</span>
            <span className='font-bold text-3xl tabular-nums'>
              {allTotal.toLocaleString('ja-JP')}
            </span>
          </div>
          <Search />
        </CardHeader>
        <Separator />
        <DataTable
          data={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          pageSizes={PageSizes}
        />
      </Card>
      {DevDataToggle && <DevDataToggle mode={devMode ?? 'demo'} />}
    </>
  );
}
