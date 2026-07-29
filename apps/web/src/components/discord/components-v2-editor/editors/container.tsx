'use client';

import { Colorful } from '@uiw/react-color';
import { ComponentType } from 'discord-api-types/v10';
import {
  BoxIcon,
  ComponentIcon,
  ImagesIcon,
  LayoutListIcon,
  MinusIcon,
  PlusIcon,
  SettingsIcon,
  TypeIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useDebounceCallback } from 'usehooks-ts';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  useControlledField,
} from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { FieldContent, FieldGroup } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';
import { defaultComponentValues } from '../schema';
import { ComponentEditorByType } from './index';

const numToHex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const hexToNum = (hex: string) => Number.parseInt(hex.replace('#', ''), 16);

function AccentColorInputGroup() {
  const { field } = useControlledField();
  const value = field.value as number | null | undefined;
  const hasValue = typeof value === 'number';

  const [color, setColor] = useState(hasValue ? numToHex(value) : '#000000');
  const [hexInput, setHexInput] = useState(hasValue ? color.slice(1).toUpperCase() : '');

  const debouncedOnChange = useDebounceCallback(
    (hex: string) => field.onChange(hexToNum(hex)),
    100,
  );

  return (
    <>
      <InputGroupAddon align='inline-start'>
        <Popover>
          <PopoverTrigger
            render={
              <button
                type='button'
                aria-label='アクセントカラーを選択'
                className='size-4 shrink-0 rounded-full border border-input'
                style={{ backgroundColor: color }}
              />
            }
          />
          <PopoverContent className='w-64'>
            <Colorful
              color={color}
              onChange={(result) => {
                const hex = result.hex.toLowerCase();
                setColor(hex);
                setHexInput(hex.slice(1).toUpperCase());
                debouncedOnChange(hex);
              }}
              disableAlpha
              style={{ width: '100%' }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <ControlledInputGroupInput
        value={hexInput}
        onChange={(e) => {
          const raw = e.target.value
            .replace(/[^0-9a-fA-F]/g, '')
            .slice(0, 6)
            .toUpperCase();
          setHexInput(raw);
          if (raw.length === 6) {
            const hex = `#${raw.toLowerCase()}`;
            debouncedOnChange.cancel();
            setColor(hex);
            field.onChange(hexToNum(hex));
          }
        }}
        onBlur={() => {
          if (hexInput.length === 6) return;
          setHexInput(hasValue ? color.slice(1).toUpperCase() : '');
        }}
        placeholder='000000'
        maxLength={6}
        className='font-mono'
      />
      {hasValue && (
        <InputGroupAddon align='inline-end'>
          <InputGroupButton
            size='icon-xs'
            onClick={() => {
              debouncedOnChange.cancel();
              setColor('#000000');
              setHexInput('');
              field.onChange(null);
            }}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </>
  );
}

export function ContainerEditor() {
  const form = useFormContext();
  const { basePath } = useComponentEditorContext();

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: `${basePath}.components`,
  });

  return (
    <EditorCard
      icon={BoxIcon}
      title='コンテナ'
      headerActions={
        <Popover>
          <PopoverTrigger render={<Button variant='ghost' size='icon-sm' />}>
            <SettingsIcon />
          </PopoverTrigger>
          <PopoverContent>
            <FieldGroup className='gap-5'>
              <ControlledField
                control={form.control}
                name={`${basePath}.accent_color`}
                orientation='responsive'
                align='center'
              >
                <FieldContent>
                  <ControlledFieldLabel>アクセントカラー</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <InputGroup>
                  <AccentColorInputGroup />
                </InputGroup>
              </ControlledField>
              <Separator />
              <ControlledField
                control={form.control}
                name={`${basePath}.spoiler`}
                orientation='horizontal'
              >
                <FieldContent>
                  <ControlledFieldLabel>スポイラーを有効にする</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
            </FieldGroup>
          </PopoverContent>
        </Popover>
      }
    >
      <FieldGroup className='gap-5'>
        <ControlledField control={form.control} name={`${basePath}.components`}>
          <ControlledFieldLabel className='sr-only'>コンテナ内の要素</ControlledFieldLabel>
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
                    <ComponentEditorByType
                      name={`${basePath}.components`}
                      index={index}
                      onRemove={() => remove(index)}
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
                    disabled={fields.length >= 10}
                  />
                }
              >
                <PlusIcon />
                要素を追加
              </DropdownMenuTrigger>
              <DropdownMenuContent side='bottom' align='start'>
                <DropdownMenuItem
                  onClick={() => append(defaultComponentValues[ComponentType.TextDisplay])}
                >
                  <TypeIcon />
                  テキスト
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => append(defaultComponentValues[ComponentType.Section])}
                >
                  <LayoutListIcon />
                  セクション
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => append(defaultComponentValues[ComponentType.MediaGallery])}
                >
                  <ImagesIcon />
                  ギャラリー
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => append(defaultComponentValues[ComponentType.Separator])}
                >
                  <MinusIcon />
                  区切り線
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ControlledField>
      </FieldGroup>
    </EditorCard>
  );
}
