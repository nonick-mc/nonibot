'use client';

import { type LucideIcon, TargetIcon, UserIcon, ZapIcon } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/reui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type AuditLogAuthor, actionTypeTexts, targetNameTexts } from './columns';

type Option = { value: string; label: string; avatarUrl?: string };

export type UserOption = { id: string; author: AuditLogAuthor | null };

function FilterPopover({
  param,
  title,
  icon: Icon,
  options,
}: {
  param: string;
  title: string;
  icon: LucideIcon;
  options: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.getAll(param);

  const toggle = (value: string, checked: boolean) => {
    const next = new URLSearchParams(searchParams);
    next.delete(param);
    for (const v of checked ? [...selected, value] : selected.filter((s) => s !== value)) {
      next.append(param, v);
    }
    // 絞り込みが変わったら1ページ目に戻す
    next.delete('page');
    router.push(`${pathname}?${next}` as Route);
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' size='sm' />}>
        <Icon />
        {title}
        {selected.length > 0 && <Badge variant='outline'>{selected.length}</Badge>}
      </PopoverTrigger>
      <PopoverContent className='max-h-80 w-64 gap-1 overflow-y-auto p-2'>
        {options.length === 0 && (
          <p className='p-2 text-muted-foreground text-sm'>選択肢がありません。</p>
        )}
        {options.map((option) => (
          // biome-ignore lint/a11y/noLabelWithoutControl: Checkboxを内包している
          <label
            key={option.value}
            className='flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-accent'
          >
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
            />
            {option.avatarUrl !== undefined && (
              <Avatar className='size-5'>
                <AvatarImage src={option.avatarUrl} />
                <AvatarFallback>{option.label.slice(0, 1)}</AvatarFallback>
              </Avatar>
            )}
            <span className='truncate'>{option.label}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function Filters({ users }: { users: UserOption[] }) {
  return (
    <div className='flex flex-wrap gap-2'>
      <FilterPopover
        param='user'
        title='ユーザー'
        icon={UserIcon}
        options={users.map(({ id, author }) => ({
          value: id,
          label: author?.displayName ?? '不明なユーザー',
          avatarUrl: author?.avatarUrl ?? '',
        }))}
      />
      <FilterPopover
        param='target'
        title='対象'
        icon={TargetIcon}
        options={Object.entries(targetNameTexts).map(([value, label]) => ({ value, label }))}
      />
      <FilterPopover
        param='action'
        title='アクション'
        icon={ZapIcon}
        options={Object.entries(actionTypeTexts).map(([value, label]) => ({ value, label }))}
      />
    </div>
  );
}
