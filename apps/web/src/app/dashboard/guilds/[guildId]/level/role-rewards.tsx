'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiRole } from '@repo/shared/types';
import { type ColumnDef, useTable } from '@tanstack/react-table';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import { RoleColor } from '@/components/discord/role-color';
import {
  DataGrid,
  DataGridContainer,
  type DataGridFeatures,
  dataGridFeatures,
} from '@/components/reui/data-grid/data-grid';
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  ControlledFieldProvider,
} from '@/components/rhf/field';
import { ControlledNumberInput } from '@/components/rhf/number-input';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useDialogState } from '@/hooks/use-dialog-state';
import { cn } from '@/lib/utils';
import { type formSchema, roleRewardSchema } from './schema';

const MaxRewards = 20;

const modeLabels = {
  add: '付け足す',
  replace: '直前の報酬と入れ替える',
} as const;

type Reward = z.infer<typeof roleRewardSchema>;
type Row = Reward & { index: number };

type RoleRewardsFieldProps = {
  /** 付与できるロール */
  roles: InternalApiRole[];
  allRoles: InternalApiRole[];
  disabled?: boolean;
};

export function RoleRewardsField({ roles, allRoles, disabled }: RoleRewardsFieldProps) {
  const form = useFormContext<z.input<typeof formSchema>>();
  const { fields, replace, remove } = useFieldArray({
    control: form.control,
    name: 'roleRewards',
  });
  // -1: 新規追加 / 0以上: 編集中の行
  const dialog = useDialogState<number>();
  const editing = dialog.value ?? -1;

  const columns: ColumnDef<DataGridFeatures, Row>[] = [
    { id: 'level', header: 'レベル', cell: ({ row }) => `Lv.${row.original.level}` },
    {
      id: 'role',
      header: 'ロール',
      cell: ({ row }) => {
        const role = allRoles.find((r) => r.id === row.original.roleId);
        return role ? (
          <div className='flex items-center gap-2'>
            <RoleColor colors={role.colors} />
            <span className='truncate'>{role.name}</span>
          </div>
        ) : (
          <span className='text-muted-foreground'>不明なロール</span>
        );
      },
    },
    { id: 'mode', header: '付与方法', cell: ({ row }) => modeLabels[row.original.mode] },
    {
      id: 'actions',
      header: '',
      meta: { cellClassName: 'w-0' },
      cell: ({ row }) => (
        <div className='flex justify-end gap-1'>
          <Button
            type='button'
            size='icon-sm'
            variant='outline'
            aria-label='編集'
            onClick={() => dialog.show(row.original.index)}
            disabled={disabled}
          >
            <PencilIcon />
          </Button>
          <Button
            type='button'
            size='icon-sm'
            variant='outline'
            aria-label='削除'
            onClick={() => remove(row.original.index)}
            disabled={disabled}
          >
            <Trash2Icon className='text-destructive' />
          </Button>
        </div>
      ),
    },
  ];

  const table = useTable({
    features: dataGridFeatures,
    data: fields.map((field, index) => ({ ...(field as Reward), index })),
    columns,
    getRowId: (row) => fields[row.index].id,
    manualPagination: true,
  });

  return (
    <Field data-disabled={disabled} orientation='responsive'>
      <FieldContent>
        <ControlledFieldProvider control={form.control} name='roleRewards'>
          <ControlledFieldLabel>レベル到達時に付与するロール</ControlledFieldLabel>
          <FieldDescription>
            特定のレベルに到達した際に付与するロールをカスタマイズします。
          </FieldDescription>
          <ControlledFieldError />
        </ControlledFieldProvider>
      </FieldContent>
      <div className='sm:flex-1 min-w-0 flex flex-col gap-3'>
        <Card className={cn('p-3', { 'opacity-50': disabled })}>
          <DataGrid
            table={table}
            recordCount={fields.length}
            emptyMessage='ロール報酬が未設定です。'
            tableLayout={{ width: 'auto' }}
            tableClassNames={{ base: 'whitespace-nowrap' }}
          >
            <DataGridContainer>
              <div className='no-scrollbar scroll-fade-x overflow-x-auto'>
                <DataGridTable />
              </div>
            </DataGridContainer>
          </DataGrid>
        </Card>
        <Button
          type='button'
          className='w-full text-foreground!'
          variant='outline'
          onClick={() => dialog.show(-1)}
          disabled={fields.length >= MaxRewards || disabled}
        >
          <PlusIcon />
          報酬を追加
        </Button>
      </div>
      <RewardDialog
        key={dialog.key}
        {...dialog.props}
        defaultValues={editing >= 0 ? (fields[editing] as Reward) : undefined}
        // 他の報酬で使っているロールは選択できない
        roles={roles.filter(
          (role) => !fields.some((f, i) => i !== editing && (f as Reward).roleId === role.id),
        )}
        allRoles={allRoles}
        usedLevels={fields.filter((_, i) => i !== editing).map((f) => (f as Reward).level)}
        onSave={(reward) => {
          const rewards = (form.getValues('roleRewards') ?? []) as Reward[];
          const next = editing === -1 ? [...rewards, reward] : rewards.with(editing, reward);
          replace(next.toSorted((a, b) => a.level - b.level));
          dialog.close();
        }}
      />
    </Field>
  );
}

type RewardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Reward;
  roles: InternalApiRole[];
  allRoles: InternalApiRole[];
  /** 他の報酬で使っているレベル */
  usedLevels: number[];
  onSave: (reward: Reward) => void;
};

function RewardDialog({
  open,
  onOpenChange,
  defaultValues,
  roles,
  allRoles,
  usedLevels,
  onSave,
}: RewardDialogProps) {
  const form = useForm<z.input<typeof roleRewardSchema>, unknown, Reward>({
    resolver: zodResolver(
      roleRewardSchema.refine((r) => !usedLevels.includes(r.level), {
        message: 'このレベルには既に報酬が設定されています。',
        path: ['level'],
      }),
    ),
    defaultValues: defaultValues ?? { level: Number.NaN, roleId: '', mode: 'add' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormProvider {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(onSave)(e);
            }}
          >
            <DialogHeader>
              <DialogTitle>{defaultValues ? '報酬を編集' : '報酬を追加'}</DialogTitle>
            </DialogHeader>
            <FieldGroup className='py-8'>
              <ControlledField control={form.control} name='level'>
                <FieldContent>
                  <ControlledFieldLabel>レベル</ControlledFieldLabel>
                  <FieldDescription>
                    このレベルに到達したときにロールを付与します。
                  </FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledNumberInput min={1} max={10000} step={1} placeholder='1〜10000' />
              </ControlledField>
              <Separator />
              <ControlledField control={form.control} name='roleId'>
                <FieldContent>
                  <ControlledFieldLabel>付与するロール</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledRoleSelect
                  items={allRoles}
                  disabledItemFilter={(role) => !roles.includes(role)}
                />
              </ControlledField>
              <Separator />
              <ControlledField control={form.control} name='mode'>
                <FieldContent>
                  <ControlledFieldLabel>付与方法</ControlledFieldLabel>
                  <FieldDescription>
                    「直前の報酬と入れ替える」を選択すると、１つ前の報酬に設定していたロールを外して追加します。
                  </FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSelect>
                  <ControlledSelectTrigger className='w-full'>
                    <SelectValue>
                      {(value: keyof typeof modeLabels) => modeLabels[value]}
                    </SelectValue>
                  </ControlledSelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {(['add', 'replace'] as const).map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {modeLabels[mode]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </ControlledSelect>
              </ControlledField>
            </FieldGroup>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type='submit'>{defaultValues ? '保存' : '追加'}</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
