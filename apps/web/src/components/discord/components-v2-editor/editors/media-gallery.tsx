'use client';

import {
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  ImagesIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/reui/sortable';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldProvider,
} from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';

export function MediaGalleryEditor() {
  const form = useFormContext();
  const { basePath } = useComponentEditorContext();

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: `${basePath}.items`,
  });

  return (
    <EditorCard icon={ImagesIcon} title='ギャラリー'>
      <div className='flex flex-col gap-4'>
        <ControlledFieldProvider control={form.control} name={`${basePath}.items`}>
          <ControlledFieldError />
        </ControlledFieldProvider>
        <div className='flex flex-col gap-3'>
          {fields.length ? (
            <Sortable
              className='flex flex-col gap-2'
              value={fields.map((f) => ({ id: f.id }))}
              onValueChange={() => {}}
              getItemValue={(item) => item.id}
              onMove={({ activeIndex, overIndex }) => move(activeIndex, overIndex)}
              strategy='vertical'
            >
              {fields.map((field, itemIndex) => (
                <SortableItem key={field.id} value={field.id} className='flex gap-1 items-center'>
                  <SortableItemHandle>
                    <GripVerticalIcon className='size-4 text-muted-foreground' />
                  </SortableItemHandle>
                  <ControlledField
                    control={form.control}
                    name={`${basePath}.items.${itemIndex}.media.url`}
                  >
                    <InputGroup>
                      <ControlledInputGroupInput placeholder='URLを入力' />
                      <InputGroupAddon align='inline-start'>
                        <LinkIcon />
                      </InputGroupAddon>
                      <InputGroupAddon align='inline-end'>
                        <Tooltip>
                          <Controller
                            control={form.control}
                            name={`${basePath}.items.${itemIndex}.spoiler`}
                            render={({ field }) => (
                              <TooltipTrigger
                                render={
                                  <Button
                                    onClick={() => field.onChange(!field.value)}
                                    variant='ghost'
                                    size='icon-sm'
                                  >
                                    {field.value ? <EyeOffIcon /> : <EyeIcon />}
                                  </Button>
                                }
                              />
                            )}
                          />
                          <TooltipContent>ネタバレ添付ファイル</TooltipContent>
                        </Tooltip>
                      </InputGroupAddon>
                    </InputGroup>
                    <ControlledFieldError />
                  </ControlledField>
                  <Button onClick={() => remove(itemIndex)} size='icon-sm' variant='ghost'>
                    <Trash2Icon className='text-destructive' />
                  </Button>
                </SortableItem>
              ))}
            </Sortable>
          ) : (
            <Empty className='border border-dashed py-6'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <ImagesIcon />
                </EmptyMedia>
                <EmptyTitle className='text-foreground'>画像がありません</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </div>
        <Button
          onClick={() => append({ media: { url: '' }, spoiler: false })}
          variant='outline'
          size='sm'
          disabled={fields.length >= 10}
        >
          <PlusIcon />
          画像を追加
        </Button>
      </div>
    </EditorCard>
  );
}
