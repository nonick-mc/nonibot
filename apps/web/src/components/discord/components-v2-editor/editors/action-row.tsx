'use client';

import { ComponentType } from 'discord-api-types/v10';
import {
  ComponentIcon,
  LinkIcon,
  MousePointerClickIcon,
  PlusIcon,
  RectangleEllipsisIcon,
} from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';
import {
  ButtonEditor,
  createDefaultButton,
  createDefaultUrlButton,
  useButtonActions,
} from './button';

export function ActionRowEditor() {
  const { control } = useFormContext();
  const { basePath } = useComponentEditorContext();
  const buttonActions = useButtonActions();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${basePath}.components`,
  });

  // ActionRowには同じ種類の要素しか配置できない
  const firstChildType = useWatch({ control, name: `${basePath}.components.0.type` });
  const canAdd = (type: ComponentType) => firstChildType === undefined || firstChildType === type;

  return (
    <EditorCard withSortableItemHandle icon={RectangleEllipsisIcon} title='アクション行'>
      <ControlledField control={control} name={`${basePath}.components`}>
        <ControlledFieldLabel className='sr-only'>アクション行内の要素</ControlledFieldLabel>
        <ControlledFieldError />
        <div className='flex flex-col gap-3'>
          {fields.length ? (
            <Sortable
              className='flex flex-col gap-3'
              value={fields.map((f) => ({ id: f.id }))}
              onValueChange={() => {}}
              getItemValue={(item) => item.id}
              onMove={({ activeIndex, overIndex }) => move(activeIndex, overIndex)}
              strategy='vertical'
            >
              {fields.map((field, index) => (
                <SortableItem key={field.id} value={field.id}>
                  <ButtonEditor
                    basePath={`${basePath}.components.${index}`}
                    onRemove={() => remove(index)}
                    withSortableItemHandle
                  />
                </SortableItem>
              ))}
            </Sortable>
          ) : (
            <Empty className='border border-dashed py-6'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <ComponentIcon />
                </EmptyMedia>
                <EmptyTitle className='text-foreground'>要素がありません</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className='sm:w-fit text-foreground'
                  variant='outline'
                  size='sm'
                  disabled={fields.length >= 5}
                />
              }
            >
              <PlusIcon />
              要素を追加
            </DropdownMenuTrigger>
            <DropdownMenuContent side='bottom' align='start'>
              <DropdownMenuItem
                onClick={() => append(createDefaultButton(buttonActions[0]))}
                disabled={!canAdd(ComponentType.Button) || buttonActions.length === 0}
              >
                <MousePointerClickIcon />
                ボタン
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => append(createDefaultUrlButton())}
                disabled={!canAdd(ComponentType.Button)}
              >
                <LinkIcon />
                URLボタン
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ControlledField>
    </EditorCard>
  );
}
