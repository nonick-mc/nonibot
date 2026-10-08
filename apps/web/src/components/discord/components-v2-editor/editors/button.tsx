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
import { useContext, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { DiscordEmojiPicker } from '@/components/discord/emoji-picker';
import { PlaceholderPickerButton } from '@/components/placeholder/placeholder-picker-button';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
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
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverPanel, PopoverTrigger } from '@/components/ui/popover';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DiscordMessageContext } from '../../message-context';
import { DiscordButtonEmoji } from '../../preview/button';
import { ComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';

const ButtonStyleOptions = [
  { label: 'Primary', value: ButtonStyle.Primary, colorClassName: 'bg-discord-primary' },
  { label: 'Secondary', value: ButtonStyle.Secondary, colorClassName: 'border bg-input/30' },
  { label: 'Success', value: ButtonStyle.Success, colorClassName: 'bg-discord-success' },
  { label: 'Danger', value: ButtonStyle.Danger, colorClassName: 'bg-discord-danger' },
];

function ButtonStyleColor({ style }: { style: ButtonStyle }) {
  const option = ButtonStyleOptions.find((o) => o.value === style);
  return <span className={cn('size-[0.75em] shrink-0 rounded-full', option?.colorClassName)} />;
}

export function useButtonActions() {
  const { componentActions = [] } = useContext(DiscordMessageContext);
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
  const { emojis } = useContext(DiscordMessageContext);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openPickerAfterMenuClose = useRef(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Popover
          open={pickerOpen}
          onOpenChange={(open, { reason }) => {
            if (field.value && reason === 'trigger-press') return;
            setPickerOpen(open);
          }}
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
                render={
                  <PopoverTrigger
                    render={<DropdownMenuTrigger render={<InputGroupButton size='icon-xs' />} />}
                  />
                }
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
          <PopoverPanel side='top' align='start' initialFocus={false} finalFocus={false}>
            <DiscordEmojiPicker
              guildEmojis={emojis}
              onEmojiSelect={(value) => {
                field.onChange(parseEmoji(value));
                setPickerOpen(false);
              }}
            />
          </PopoverPanel>
        </Popover>
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
            <PopoverContent>
              <FieldGroup className='gap-5'>
                <ControlledField
                  control={control}
                  name={`${basePath}.style`}
                  orientation='responsive'
                  align='center'
                >
                  <FieldContent>
                    <ControlledFieldLabel>ボタンの色</ControlledFieldLabel>
                    <ControlledFieldError />
                  </FieldContent>
                  <ControlledSelect<ButtonStyle>>
                    <ControlledSelectTrigger>
                      <SelectValue>
                        {(value: ButtonStyle) => (
                          <div className='flex items-center gap-2.5'>
                            <ButtonStyleColor style={value} />
                            {ButtonStyleOptions.find((o) => o.value === value)?.label}
                          </div>
                        )}
                      </SelectValue>
                    </ControlledSelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {ButtonStyleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className='flex items-center gap-2.5'>
                              <ButtonStyleColor style={option.value} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </ControlledSelect>
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
                <PlaceholderPickerButton inputRef={urlRef} types={['url']} mode='replace' />
              </InputGroupAddon>
            </InputGroup>
          </ControlledField>
        </FieldGroup>
      </EditorCard>
    </ComponentEditorContext.Provider>
  );
}
