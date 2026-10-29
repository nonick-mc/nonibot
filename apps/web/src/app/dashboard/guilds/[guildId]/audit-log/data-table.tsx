'use client';

import { useTable } from '@tanstack/react-table';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
} from '@/components/reui/data-grid/data-grid';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import { type CustomizedAuditLog, columns } from './columns';

type Props = {
  data: CustomizedAuditLog[];
  total: number;
  page: number;
  pageSize: number;
};

export function DataTable({ data, total, page, pageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();

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
      router.push(`${pathname}?page=${nextPage}&pageSize=${next.pageSize}` as Route);
    },
  });

  return (
    <DataGrid table={table} recordCount={total} emptyMessage='ログがありません。'>
      <DataGridContainer>
        <DataGridTable />
      </DataGridContainer>
      <DataGridPagination
        sizes={[10, 25, 50]}
        rowsPerPageLabel='表示件数'
        info='{count}件中 {from}-{to}件'
      />
    </DataGrid>
  );
}
