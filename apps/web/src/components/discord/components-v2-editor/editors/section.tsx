'use client';

import { ComponentType } from 'discord-api-types/v10';
import {
  ComponentIcon,
  EyeIcon,
  EyeOffIcon,
  LayoutListIcon,
  LinkIcon,
  PlusIcon,
} from 'lucide-react';
import { useRef } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useComponentEditorContext } from '../context';
import { DebouncedUrlInput } from '../debounced-url-input';
import { EditorCard } from '../editor-card';
import { PlaceholderPickerButton } from '../placeholder-picker-button';
import { defaultComponentValues } from '../schema';
import { ComponentEditorByType } from './index';

export function SectionEditor() {
  const form = useFormContext();
  const { basePath } = useComponentEditorContext();
  const thumbnailUrlRef = useRef<HTMLInputElement>(null);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: `${basePath}.components`,
  });

  return (
    <EditorCard icon={LayoutListIcon} title='セクション'>
      <div className='flex flex-col gap-4'>
        <FieldGroup className='gap-5'>
          <ControlledField
            control={form.control}
            name={`${basePath}.accessory.media.url`}
            orientation='responsive'
            align='center'
          >
            <FieldContent>
              <ControlledFieldLabel>サムネイル画像</ControlledFieldLabel>
              <FieldDescription>画像は右側に表示されます。</FieldDescription>
              <ControlledFieldError />
            </FieldContent>
            <InputGroup className='@md/field-group:w-sm!'>
              <DebouncedUrlInput inputRef={thumbnailUrlRef} placeholder='URLを入力' />
              <InputGroupAddon align='inline-start'>
                <LinkIcon />
              </InputGroupAddon>
              <InputGroupAddon className='gap-0.5' align='inline-end'>
                <PlaceholderPickerButton inputRef={thumbnailUrlRef} urlOnly mode='replace' />
                <Tooltip>
                  <Controller
                    control={form.control}
                    name={`${basePath}.accessory.spoiler`}
                    render={({ field }) => (
                      <TooltipTrigger
                        render={
                          <InputGroupButton
                            onClick={() => field.onChange(!field.value)}
                            size='icon-xs'
                          />
                        }
                      >
                        {field.value ? <EyeOffIcon /> : <EyeIcon />}
                      </TooltipTrigger>
                    )}
                  />
                  <TooltipContent>ネタバレ添付ファイル</TooltipContent>
                </Tooltip>
              </InputGroupAddon>
            </InputGroup>
          </ControlledField>
          <Separator />
          <ControlledField control={form.control} name={`${basePath}.components`}>
            <ControlledFieldLabel className='sr-only'>セクション内の要素</ControlledFieldLabel>
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
                  {fields.map((field, itemIndex) => (
                    <SortableItem key={field.id} value={field.id}>
                      <ComponentEditorByType
                        name={`${basePath}.components`}
                        index={itemIndex}
                        onRemove={() => remove(itemIndex)}
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
              <Button
                className='sm:w-fit text-foreground'
                onClick={() => append(defaultComponentValues[ComponentType.TextDisplay])}
                variant='outline'
                size='sm'
                disabled={fields.length >= 3}
              >
                <PlusIcon />
                テキストを追加
              </Button>
            </div>
          </ControlledField>
        </FieldGroup>
      </div>
    </EditorCard>
  );
}
