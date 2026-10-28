'use client';

import type { AllowedComponent } from '@repo/shared';
import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import {
  LinkIcon,
  type LucideIcon,
  MousePointerClickIcon,
  PaletteIcon,
  SmileIcon,
  SmilePlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
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
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DiscordButtonEmoji } from '../../preview/button';
import { ComponentEditorContext, useEditorResources } from '../context';
import { EditorCard } from '../editor-card';
import { EditorPlaceholderPicker } from '../placeholder-picker';

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

export function useAllowedButtons() {
  const { allowedComponents = [] } = useEditorResources();
  return allowedComponents.filter((allowed) => allowed.type === ComponentType.Button);
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

export function createDefaultButton(allowed: AllowedComponent) {
  return {
    type: ComponentType.Button,
    style: ButtonStyle.Secondary,
    custom_id: allowed.customId,
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
  if (style === ButtonStyle.Link) return <URLButtonEditor {...props} />;
  return <UserActionButtonEditor {...props} />;
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
      <InputGroup className='@md/field-group:w-2xs'>
        <InputGroupAddon align='inline-start'>
          <EmojiField name={`${basePath}.emoji`} />
        </InputGroupAddon>
        <ControlledInputGroupInput placeholder='ラベルを入力' maxLength={80} />
      </InputGroup>
    </ControlledField>
  );
}

function InteractiveButtonCard({
  basePath,
  onRemove,
  withSortableItemHandle,
  icon,
  title,
  children,
}: ButtonEditorProps & { icon: LucideIcon; title: string; children: ReactNode }) {
  const { control } = useFormContext();

  return (
    <ComponentEditorContext.Provider value={{ basePath, onRemove }}>
      <EditorCard
        icon={icon}
        title={title}
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
          {children}
        </FieldGroup>
      </EditorCard>
    </ComponentEditorContext.Provider>
  );
}

export function UserActionButtonEditor(props: ButtonEditorProps) {
  const { control } = useFormContext();
  const allowedButtons = useAllowedButtons();

  return (
    <InteractiveButtonCard {...props} icon={MousePointerClickIcon} title='ボタン'>
      <ControlledField
        control={control}
        name={`${props.basePath}.custom_id`}
        orientation='responsive'
        align='center'
      >
        <FieldContent>
          <ControlledFieldLabel>ボタンを押した際のアクション</ControlledFieldLabel>
          <ControlledFieldError />
        </FieldContent>
        <ControlledSelect<string>>
          <ControlledSelectTrigger className='@md/field-group:w-2xs'>
            <SelectValue>
              {(value: string) => allowedButtons.find((a) => a.customId === value)?.label}
            </SelectValue>
          </ControlledSelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {allowedButtons.map((allowed) => (
                <SelectItem key={allowed.customId} value={allowed.customId}>
                  {allowed.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </ControlledSelect>
      </ControlledField>
    </InteractiveButtonCard>
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
            <InputGroup className='@md/field-group:w-2xs'>
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
