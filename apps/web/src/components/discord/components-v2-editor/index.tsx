import { ComponentIcon } from 'lucide-react';
import type {
  FieldArrayPath,
  FieldArrayWithId,
  FieldValues,
  UseFieldArrayMove,
  UseFieldArrayRemove,
} from 'react-hook-form';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { ComponentEditorByType } from './editors';

type ComponentsV2EditorProps<
  T extends FieldValues,
  N extends FieldArrayPath<T> = FieldArrayPath<T>,
> = {
  className?: string;
  name: N;
  fields: FieldArrayWithId<T, N>[];
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
};

export const ComponentsV2Editor = <
  T extends FieldValues,
  N extends FieldArrayPath<T> = FieldArrayPath<T>,
>({
  className,
  name,
  fields,
  remove,
  move,
}: ComponentsV2EditorProps<T, N>) => {
  if (!fields.length) {
    return (
      <Empty className={cn('border border-dashed py-10', className)}>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <ComponentIcon />
          </EmptyMedia>
          <EmptyTitle>要素がありません</EmptyTitle>
          <EmptyDescription>
            「要素を追加」ボタンを使用して、メッセージを作成しましょう。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Sortable
      className={cn('flex flex-col gap-4', className)}
      value={fields.map((f) => ({ id: f.id }))}
      onValueChange={() => {}}
      getItemValue={(item) => item.id}
      onMove={({ activeIndex, overIndex }) => move(activeIndex, overIndex)}
      strategy='vertical'
    >
      {fields.map((field, index) => (
        <SortableItem key={field.id} value={field.id}>
          <ComponentEditorByType name={name} index={index} onRemove={() => remove(index)} />
        </SortableItem>
      ))}
    </Sortable>
  );
};
