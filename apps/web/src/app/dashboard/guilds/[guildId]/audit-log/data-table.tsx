'use client';

import { useTable } from '@tanstack/react-table';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
} from '@/components/reui/data-grid/data-grid';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type CustomizedAuditLog, columns } from './columns';
import type { Resources } from './describe';
import { DetailSheet } from './detail-sheet';

type Props = {
  data: CustomizedAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  resources: Resources;
};

export function DataTable({ data, total, page, pageSize, resources }: Props) {
  const [selected, setSelected] = useState<CustomizedAuditLog | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: total,
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize }) : updater;
      // ページサイズ変更時は1ページ目に戻す
      const nextPage = next.pageSize === pageSize ? next.pageIndex + 1 : 1;
      const params = new URLSearchParams(searchParams);
      params.set('page', String(nextPage));
      params.set('pageSize', String(next.pageSize));
      router.push(`${pathname}?${params}` as Route);
    },
  });

  return (
    <>
      <DataGrid
        table={table}
        recordCount={total}
        emptyMessage='ログがありません。'
        onRowClick={setSelected}
        tableClassNames={{ base: 'min-w-180' }}
      >
        <CardContent>
          <DataGridContainer>
            <div className='no-scrollbar scroll-fade-x overflow-x-auto'>
              <DataGridTable />
            </div>
          </DataGridContainer>
        </CardContent>
        <Separator />
        <CardFooter>
          <DataGridPagination
            sizes={[10, 25, 50]}
            rowsPerPageLabel='表示件数'
            info='{count}件中 {from}-{to}件'
          />
        </CardFooter>
      </DataGrid>
      <DetailSheet log={selected} resources={resources} onClose={() => setSelected(null)} />
    </>
  );
}
