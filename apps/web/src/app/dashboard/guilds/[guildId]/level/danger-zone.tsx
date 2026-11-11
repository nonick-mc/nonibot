'use client';

import { type ColumnDef, useTable } from '@tanstack/react-table';
import { cn } from 'cn';
import dayjs from 'dayjs';
import {
  CircleAlertIcon,
  DownloadIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  UploadIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCurrentGuild } from '@/components/discord/current-guild';
import { Alert, AlertTitle } from '@/components/reui/alert';
import {
  DataGrid,
  DataGridContainer,
  type DataGridFeatures,
  dataGridFeatures,
} from '@/components/reui/data-grid/data-grid';
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
} from '@/components/ui/code-block';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useDialogState } from '@/hooks/use-dialog-state';
import {
  exportMemberLevelsAction,
  importMemberLevelsAction,
  resetMemberLevelsAction,
} from './action';
import { type LevelData, levelDataSchema } from './schema';

const ErrorPreviewCount = 5;

const MaxFileSize = 5 * 1024 * 1024;

type LevelRow = LevelData['data'][number];

const PreviewPageSize = 100;

const levelColumns: ColumnDef<DataGridFeatures, LevelRow>[] = [
  { id: 'userId', header: 'ユーザーID', cell: ({ row }) => row.original.userId },
  { id: 'lv', header: 'レベル', cell: ({ row }) => row.original.lv.toLocaleString() },
  { id: 'xp', header: '経験値', cell: ({ row }) => row.original.xp.toLocaleString() },
];

/** インポートするデータのプレビュー */
function LevelDataTable({ data }: { data: LevelRow[] }) {
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns: levelColumns,
    getRowId: (row) => row.userId,
    initialState: { pagination: { pageIndex: 0, pageSize: PreviewPageSize } },
  });

  return (
    <Card className='p-3'>
      <DataGrid
        table={table}
        recordCount={data.length}
        emptyMessage='データがありません。'
        tableClassNames={{ base: 'whitespace-nowrap' }}
      >
        <div className='flex flex-col'>
          <DataGridContainer>
            <div className='no-scrollbar scroll-fade-x max-h-80 overflow-auto scroll-fade-y'>
              <DataGridTable />
            </div>
          </DataGridContainer>
          <DataGridPagination sizes={[PreviewPageSize]} info='{count}件中 {from}-{to}件' />
        </div>
      </DataGrid>
    </Card>
  );
}

function useConfirmText() {
  const { guildId } = useParams<{ guildId: string }>();
  return useCurrentGuild()?.name ?? guildId;
}

function ConfirmInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const confirmText = useConfirmText();
  return (
    <Field>
      <FieldLabel htmlFor='danger-zone-confirm'>
        確認のため「{confirmText}」と入力してください
      </FieldLabel>
      <Input
        id='danger-zone-confirm'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={confirmText}
        autoComplete='off'
      />
    </Field>
  );
}

function ExportButton({ disabled }: { disabled: boolean }) {
  const { guildId } = useParams<{ guildId: string }>();
  const [isLoading, setIsLoading] = useState(false);

  async function onExport() {
    const bindExportMemberLevelsAction = exportMemberLevelsAction.bind(null, guildId);
    setIsLoading(true);
    const res = await bindExportMemberLevelsAction().catch(() => undefined);
    setIsLoading(false);
    if (!res?.data) {
      return toast.error(res?.serverError ?? 'エクスポート中に問題が発生しました。');
    }

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${guildId}-${dayjs().format('YYYYMMDD')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant='outline' onClick={onExport} disabled={disabled || isLoading}>
      {isLoading ? <Spinner /> : <DownloadIcon />}
      エクスポート
    </Button>
  );
}

function ImportDialog() {
  const { guildId } = useParams<{ guildId: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorDialog = useDialogState<string[]>();
  const importDialog = useDialogState<LevelData>();
  const errors = errorDialog.value ?? [];
  const file = importDialog.value;

  // ファイルを選択したら検証し、問題があればエラーのダイアログ、なければインポートのダイアログを開く
  async function onFileChange(input: HTMLInputElement) {
    const selected = input.files?.[0];
    input.value = '';

    if (!selected) return;
    if (selected.size > MaxFileSize) {
      return errorDialog.show(['ファイルサイズが大きすぎます。(最大5MB)']);
    }

    let json: unknown;
    try {
      json = JSON.parse(await selected.text());
    } catch {
      return errorDialog.show(['JSONファイルとして読み込めませんでした。']);
    }

    const result = levelDataSchema.safeParse(json);
    if (!result.success) {
      const { issues } = result.error;
      return errorDialog.show([
        `${issues.length}件の問題が見つかりました。`,
        ...issues
          .slice(0, ErrorPreviewCount)
          .map((issue) => `${issue.path.join('.') || '(ルート)'}: ${issue.message}`),
      ]);
    }
    importDialog.show(result.data);
  }

  async function onImport() {
    if (!file) return;
    const bindImportMemberLevelsAction = importMemberLevelsAction.bind(null, guildId);
    setIsLoading(true);
    const res = await bindImportMemberLevelsAction(file).catch(() => undefined);
    setIsLoading(false);
    if (!res?.data) {
      return toast.error(res?.serverError ?? 'インポート中に問題が発生しました。');
    }
    toast.success(
      `${res.data.changed}人のレベルを変更しました。` +
        (res.data.excluded ? `（サーバーにいない${res.data.excluded}人をインポートから除外）` : ''),
    );
    importDialog.close();
  }

  return (
    <>
      <Button variant='outline' onClick={() => inputRef.current?.click()}>
        <UploadIcon />
        インポート
      </Button>
      <input
        ref={inputRef}
        type='file'
        accept='application/json,.json'
        className='hidden'
        onChange={(e) => onFileChange(e.currentTarget)}
      />
      <AlertDialog {...errorDialog.props}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>インポートに失敗しました</AlertDialogTitle>
            <AlertDialogDescription>
              ファイルの内容を修正してから、もう一度インポートしてください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <CodeBlock>
            <CodeBlockActions>
              <CodeBlockCopyButton value={errors.join('\n')} />
            </CodeBlockActions>
            <CodeBlockContent>{errors.join('\n')}</CodeBlockContent>
          </CodeBlock>
          <AlertDialogFooter>
            <AlertDialogCancel>閉じる</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog {...importDialog.props}>
        <AlertDialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto data-[size=default]:sm:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle>レベルをインポート</AlertDialogTitle>
            <AlertDialogDescription>
              ファイルに含まれるメンバーのレベルと経験値を上書きしてもよろしいですか？この変更は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup>
            <Field>
              {file && <LevelDataTable data={file.data} />}
              {file?.guildId && file.guildId !== guildId && (
                <p className='flex items-center gap-1.5 text-warning text-sm'>
                  <TriangleAlertIcon className='size-4 shrink-0' />
                  別のサーバーからエクスポートされたファイルです。
                </p>
              )}
            </Field>
          </FieldGroup>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={onImport} disabled={isLoading}>
              {isLoading ? <Spinner /> : <DownloadIcon />}
              インポート
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ResetDialog() {
  const { guildId } = useParams<{ guildId: string }>();
  const confirmText = useConfirmText();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirm, setConfirm] = useState('');

  function onOpenChange(value: boolean) {
    setOpen(value);
    if (!value) setConfirm('');
  }

  async function onReset() {
    const bindResetMemberLevelsAction = resetMemberLevelsAction.bind(null, guildId);
    setIsLoading(true);
    const res = await bindResetMemberLevelsAction().catch(() => undefined);
    setIsLoading(false);
    if (!res?.data) {
      return toast.error(res?.serverError ?? 'リセット中に問題が発生しました。');
    }
    toast.success('レベルデータをリセットしました。');
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button variant='destructive'>
            <RotateCcwIcon />
            リセット
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>レベルデータをリセット</AlertDialogTitle>
          <AlertDialogDescription>
            本当に全メンバーのレベルと経験値を削除してもよろしいですか？この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant='info'>
          <CircleAlertIcon />
          <AlertTitle>
            レベルをリセットする前に、「レベルデータをエクスポート」からデータをバックアップすることを推奨します。
          </AlertTitle>
        </Alert>
        <ConfirmInput value={confirm} onChange={setConfirm} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReset}
            variant='destructive'
            disabled={confirm !== confirmText || isLoading}
          >
            {isLoading ? <Spinner /> : <RotateCcwIcon />}
            リセット
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DangerZone({
  className,
  hasLevelData,
}: {
  className?: string;
  hasLevelData: boolean;
}) {
  return (
    <Card className={cn('ring-destructive', className)}>
      <CardContent>
        <FieldGroup>
          <Field orientation='responsive'>
            <FieldContent>
              <FieldTitle>レベルデータをエクスポート</FieldTitle>
              <FieldDescription>
                全メンバーのレベルと経験値をJSONファイルとしてダウンロードします。
              </FieldDescription>
              {!hasLevelData && (
                <p className='flex items-center gap-1.5 text-warning text-sm'>
                  <TriangleAlertIcon className='size-4 shrink-0' />
                  エクスポートできるレベルデータがありません。
                </p>
              )}
            </FieldContent>
            <ExportButton disabled={!hasLevelData} />
          </Field>
          <FieldSeparator />
          <Field orientation='responsive'>
            <FieldContent>
              <FieldTitle>レベルデータのインポート</FieldTitle>
              <FieldDescription>
                指定したJSONファイルから、メンバーのレベルと経験値を一括で設定します。
              </FieldDescription>
            </FieldContent>
            <ImportDialog />
          </Field>
          <FieldSeparator />
          <Field orientation='responsive'>
            <FieldContent>
              <FieldTitle>レベルデータをリセット</FieldTitle>
              <FieldDescription>全メンバーのレベルと経験値を削除します。</FieldDescription>
            </FieldContent>
            <ResetDialog />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
