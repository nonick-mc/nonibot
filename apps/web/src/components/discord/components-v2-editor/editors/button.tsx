'use client';

import type { ComponentAction } from '@repo/shared';
import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import {
  LinkIcon,
  MousePointerClickIcon,
  PaletteIcon,
  SmileIcon,
  SmilePlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { DiscordEmojiPicker, DiscordEmojiPickerTrigger } from '@/components/discord/emoji-picker';
import { ColorPicker, ColorPickerSwatches } from '@/components/reui/color-picker';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  useControlledField,
} from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldContent, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DiscordButtonEmoji } from '../../preview/button';
import { ComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';
import { EditorPlaceholderPicker } from '../placeholder-picker';
import { useEditorResources } from '../context';

const ButtonStyleOptions = [
  { label: 'Primary', value: '#5865f2', style: ButtonStyle.Primary },
  { label: 'Secondary', value: '#4e5058', style: ButtonStyle.Secondary },
  { label: 'Success', value: '#018545', style: ButtonStyle.Success },
  { label: 'Danger', value: '#d22d3a', style: ButtonStyle.Danger },
];

function ButtonStylePicker() {
  const { field } = useControlledField();
  const value = ButtonStyleOptions.find((o) => o.style === field.value)?.value ?? null;

  return (
    <ColorPicker
      id={field.name}
      value={value}
      onValueChange={(hex) => {
        const option = ButtonStyleOptions.find((o) => o.value === hex);
        if (option) field.onChange(option.style);
      }}
      aria-label='ボタンの色'
      i18n={{ labels: { swatches: 'ボタンの色' } }}
    >
      <ColorPickerSwatches
        colors={ButtonStyleOptions}
        shape='circle'
        className='grid-cols-[repeat(4,var(--color-picker-swatch-size))] justify-start gap-2'
      />
    </ColorPicker>
  );
}

export function useButtonActions() {
  const { componentActions = [] } = useEditorResources();
  return componentActions.filter((action) => action.type === ComponentType.Button);
}

export function createDefaultUrlButton() {
  return {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: '',
    label: '',
    emoji: null,
  } as const;
}

export function createDefaultButton(action: ComponentAction) {
  return {
    type: ComponentType.Button,
    style: ButtonStyle.Secondary,
    custom_id: action.customId,
    label: '',
    emoji: null,
  } as const;
}

function parseEmoji(value: string) {
  const match = /^<(a)?:(\w+):(\d+)>$/.exec(value);
  return match ? { id: match[3], name: match[2], animated: !!match[1] } : { name: value };
}

function EmojiField({ name }: { name: string }) {
  const { control } = useFormContext();
  const { emojis } = useEditorResources();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openPickerAfterMenuClose = useRef(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DiscordEmojiPicker
          guildEmojis={emojis}
          open={pickerOpen}
          onOpenChange={(open) => {
            if (open && field.value) return;
            setPickerOpen(open);
          }}
          onEmojiSelect={(value) => field.onChange(parseEmoji(value))}
        >
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(open) => setMenuOpen(open && !!field.value)}
            onOpenChangeComplete={(open) => {
              if (open || !openPickerAfterMenuClose.current) return;
              openPickerAfterMenuClose.current = false;
              setPickerOpen(true);
            }}
          >
            <Tooltip>
              <TooltipTrigger
                render={<DropdownMenuTrigger render={<DiscordEmojiPickerTrigger />} />}
              >
                {field.value ? <DiscordButtonEmoji {...field.value} /> : <SmileIcon />}
              </TooltipTrigger>
              <TooltipContent>絵文字</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align='start'>
              <DropdownMenuItem
                onClick={() => {
                  openPickerAfterMenuClose.current = true;
                  setMenuOpen(false);
                }}
              >
                <SmilePlusIcon />
                絵文字を変更
              </DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => field.onChange(null)}>
                <Trash2Icon />
                絵文字を削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DiscordEmojiPicker>
      )}
    />
  );
}

type ButtonEditorProps = {
  basePath: string;
  onRemove: () => void;
  withSortableItemHandle?: boolean;
};

export function ButtonEditor(props: ButtonEditorProps) {
  const style = useWatch({ name: `${props.basePath}.style` });
  return style === ButtonStyle.Link ? (
    <URLButtonEditor {...props} />
  ) : (
    <UserActionButtonEditor {...props} />
  );
}

function ButtonLabelField({ basePath }: { basePath: string }) {
  const { control } = useFormContext();

  return (
    <ControlledField
      control={control}
      name={`${basePath}.label`}
      orientation='responsive'
      align='center'
    >
      <FieldContent>
        <ControlledFieldLabel>ラベル</ControlledFieldLabel>
        <ControlledFieldError />
      </FieldContent>
      <InputGroup className='sm:min-w-2xs'>
        <InputGroupAddon align='inline-start'>
          <EmojiField name={`${basePath}.emoji`} />
        </InputGroupAddon>
        <ControlledInputGroupInput placeholder='ラベルを入力' maxLength={80} />
      </InputGroup>
    </ControlledField>
  );
}

export function UserActionButtonEditor({
  basePath,
  onRemove,
  withSortableItemHandle,
}: ButtonEditorProps) {
  const { control } = useFormContext();
  const buttonActions = useButtonActions();

  return (
    <ComponentEditorContext.Provider value={{ basePath, onRemove }}>
      <EditorCard
        icon={MousePointerClickIcon}
        title='ボタン'
        headerActions={
          <Popover>
            <PopoverTrigger render={<Button variant='ghost' size='icon-sm' />}>
              <PaletteIcon />
            </PopoverTrigger>
            <PopoverContent className='w-auto' align='end'>
              <FieldGroup className='gap-5 @container-normal'>
                <ControlledField
                  control={control}
                  name={`${basePath}.style`}
                  orientation='vertical'
                  align='center'
                >
                  <FieldContent>
                    <ControlledFieldLabel>
                      <PaletteIcon className='size-4 mt-0.5 text-muted-foreground' />
                      ボタンの色
                    </ControlledFieldLabel>
                    <ControlledFieldError />
                  </FieldContent>
                  <ButtonStylePicker />
                </ControlledField>
              </FieldGroup>
            </PopoverContent>
          </Popover>
        }
        withSortableItemHandle={withSortableItemHandle}
      >
        <FieldGroup className='gap-5'>
          <ButtonLabelField basePath={basePath} />
          <FieldSeparator />
          <ControlledField
            control={control}
            name={`${basePath}.custom_id`}
            orientation='responsive'
            align='center'
          >
            <FieldContent>
              <ControlledFieldLabel>ボタンを押した際のアクション</ControlledFieldLabel>
              <ControlledFieldError />
            </FieldContent>
            <ControlledSelect<string>>
              <ControlledSelectTrigger className='sm:min-w-2xs'>
                <SelectValue>
                  {(value: string) => buttonActions.find((a) => a.customId === value)?.label}
                </SelectValue>
              </ControlledSelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {buttonActions.map((action) => (
                    <SelectItem key={action.customId} value={action.customId}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </ControlledSelect>
          </ControlledField>
        </FieldGroup>
      </EditorCard>
    </ComponentEditorContext.Provider>
  );
}

export function URLButtonEditor({ basePath, onRemove, withSortableItemHandle }: ButtonEditorProps) {
  const { control } = useFormContext();
  const urlRef = useRef<HTMLInputElement>(null);

  return (
    <ComponentEditorContext.Provider value={{ basePath, onRemove }}>
      <EditorCard icon={LinkIcon} title='URLボタン' withSortableItemHandle={withSortableItemHandle}>
        <FieldGroup className='gap-5'>
          <ButtonLabelField basePath={basePath} />
          <FieldSeparator />
          <ControlledField
            control={control}
            name={`${basePath}.url`}
            orientation='responsive'
            align='center'
          >
            <FieldContent>
              <ControlledFieldLabel>URL</ControlledFieldLabel>
              <ControlledFieldError />
            </FieldContent>
            <InputGroup className='sm:min-w-2xs'>
              <ControlledInputGroupInput ref={urlRef} placeholder='URLを入力' />
              <InputGroupAddon align='inline-start'>
                <LinkIcon />
              </InputGroupAddon>
              <InputGroupAddon align='inline-end'>
                <EditorPlaceholderPicker inputRef={urlRef} types={['url']} mode='replace' />
              </InputGroupAddon>
            </InputGroup>
          </ControlledField>
        </FieldGroup>
      </EditorCard>
    </ComponentEditorContext.Provider>
  );
}
