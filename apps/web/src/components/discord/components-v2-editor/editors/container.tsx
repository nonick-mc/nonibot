'use client';

import { ComponentType } from 'discord-api-types/v10';
import {
  BoxIcon,
  ComponentIcon,
  EyeOffIcon,
  ImagesIcon,
  LayoutListIcon,
  MinusIcon,
  PaletteIcon,
  PlusIcon,
  RectangleEllipsisIcon,
  TypeIcon,
  XIcon,
} from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerPanel,
  ColorPickerSlider,
  ColorPickerSwatches,
  useColorPicker,
} from '@/components/reui/color-picker';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  useControlledField,
} from '@/components/rhf/field';
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
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';
import { defaultComponentValues } from '../schema';
import { ComponentEditorByType } from './index';

const numToHex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const hexToNum = (hex: string) => Number.parseInt(hex.replace('#', ''), 16);

const DiscordColors = [
  { value: '#1abc9c', label: 'Teal' },
  { value: '#2ecc71', label: 'Green' },
  { value: '#3498db', label: 'Blue' },
  { value: '#9b59b6', label: 'Purple' },
  { value: '#e91e63', label: 'Magenta' },
  { value: '#f1c40f', label: 'Yellow' },
  { value: '#e67d23', label: 'Orange' },
  { value: '#e74c3d', label: 'Red' },
  { value: '#95a5a6', label: 'Light Gray' },
  { value: '#607d8b', label: 'Gray' },
  { value: '#13806a', label: 'Dark Teal' },
  { value: '#208b4c', label: 'Dark Green' },
  { value: '#206694', label: 'Dark Blue' },
  { value: '#71368a', label: 'Dark Purple' },
  { value: '#ad1357', label: 'Dark Magenta' },
  { value: '#c27c10', label: 'Dark Yellow' },
  { value: '#a84401', label: 'Dark Orange' },
  { value: '#992d22', label: 'Dark Red' },
  { value: '#979c9f', label: 'Dark Light Gray' },
  { value: '#556d7a', label: 'Dark Gray' },
];

function AccentColorClearButton() {
  const { value, clear } = useColorPicker();
  if (!value) return null;

  return (
    <InputGroupAddon align='inline-end'>
      <InputGroupButton size='icon-xs' aria-label='色を削除' onClick={clear}>
        <XIcon />
      </InputGroupButton>
    </InputGroupAddon>
  );
}

function AccentColorPicker() {
  const { field } = useControlledField();
  const value = typeof field.value === 'number' ? numToHex(field.value) : null;

  return (
    <ColorPicker
      id={field.name}
      value={value}
      onValueChange={(hex) => field.onChange(hex ? hexToNum(hex) : null)}
      aria-label='アクセントカラー'
      i18n={{
        labels: {
          placeholder: '未設定',
          panelLabel: '色を選択',
          area: '色',
          hue: '色相',
          hex: 'HEX',
          swatches: 'Discordの標準カラー',
        },
      }}
    >
      <ColorPickerPanel>
        <ColorPickerArea />
        <ColorPickerSlider channel='hue' />
        <ColorPickerSwatches
          colors={DiscordColors}
          shape='circle'
          className='grid-cols-10 gap-1 [--color-picker-swatch-size:--spacing(5)]'
        />
        <div className='flex items-center gap-2'>
          <ColorPickerEyeDropper variant='outline' size='icon' />
          <ColorPickerInput className='flex-1'>
            <AccentColorClearButton />
          </ColorPickerInput>
        </div>
      </ColorPickerPanel>
    </ColorPicker>
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
      withSortableItemHandle
      icon={BoxIcon}
      title='コンテナ'
      headerActions={
        <Popover>
          <PopoverTrigger render={<Button variant='ghost' size='icon-sm' />}>
            <PaletteIcon />
          </PopoverTrigger>
          <PopoverContent align='end'>
            <FieldGroup className='gap-5'>
              <ControlledField
                control={form.control}
                name={`${basePath}.accent_color`}
                orientation='responsive'
                align='center'
              >
                <FieldContent>
                  <ControlledFieldLabel>
                    <PaletteIcon className='size-4 mt-0.5 text-muted-foreground' />
                    アクセントカラー
                  </ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <AccentColorPicker />
              </ControlledField>
              <Separator />
              <ControlledField
                control={form.control}
                name={`${basePath}.spoiler`}
                orientation='horizontal'
              >
                <FieldContent>
                  <ControlledFieldLabel>
                    <EyeOffIcon className='size-4 mt-0.5 text-muted-foreground' />
                    スポイラーを有効にする
                  </ControlledFieldLabel>
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
                <DropdownMenuItem
                  onClick={() => append(defaultComponentValues[ComponentType.ActionRow])}
                >
                  <RectangleEllipsisIcon />
                  アクション行
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ControlledField>
      </FieldGroup>
    </EditorCard>
  );
}
