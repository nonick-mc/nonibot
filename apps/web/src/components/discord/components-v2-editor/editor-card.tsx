'use client';

import { GripVerticalIcon, type LucideIcon, Trash2Icon } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { SortableItemHandle } from '../../reui/sortable';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { useComponentEditorContext } from './context';

type EditorCardProps = {
  icon: LucideIcon;
  title: string;
  headerActions?: ReactNode;
};

export function EditorCard({
  icon: Icon,
  title,
  children,
  headerActions,
}: PropsWithChildren<EditorCardProps>) {
  const { onRemove } = useComponentEditorContext();

  return (
    <Card className='pt-0 pb-0 gap-0 bg-background/60'>
      <div className='flex items-center gap-3 px-4 py-2'>
        <SortableItemHandle
          render={<GripVerticalIcon className='size-4 mt-0.5 text-muted-foreground' />}
        />
        <div className='flex-1 flex items-center gap-2'>
          <Icon className='size-4 mt-0.5 text-muted-foreground' />
          <span className='text-sm font-medium'>{title}</span>
        </div>
        <div className='flex items-center gap-1'>
          {headerActions}
          <Button variant='ghost' size='icon-sm' onClick={onRemove}>
            <Trash2Icon className='text-destructive' />
          </Button>
        </div>
      </div>
      {children && <Card className='rounded-t-none p-4'>{children}</Card>}
    </Card>
  );
}
