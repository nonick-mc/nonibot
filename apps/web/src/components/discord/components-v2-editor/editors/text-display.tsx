'use client';

import { AtSignIcon, BotIcon, HashIcon, SmileIcon, TypeIcon } from 'lucide-react';
import { Fragment, type RefObject, useContext, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { DiscordEmojiPicker } from '@/components/discord/emoji-picker';
import { ControlledField, ControlledFieldError } from '@/components/rhf/field';
import { ControlledInputGroupTextarea } from '@/components/rhf/input-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverPanel, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { groupChannelsByCategory } from '@/lib/discord/utils';
import { ChannelTypeIcon } from '../../channel-type-icon';
import { DiscordMessageContext } from '../../message-context';
import { RoleColor } from '../../role-color';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';
import { PlaceholderPickerButton, useTextInputInsert } from '../placeholder-picker-button';

export function TextDisplayEditor() {
  const { control } = useFormContext();
  const { basePath } = useComponentEditorContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <EditorCard icon={TypeIcon} title='テキスト'>
      <ControlledField control={control} name={`${basePath}.content`}>
        <InputGroup className='max-h-96'>
          <ControlledInputGroupTextarea ref={textareaRef} placeholder='テキストを入力' />
          <InputGroupAddon align='block-end' className='pt-0 flex items-center justify-end'>
            <div className='flex items-center gap-0.5'>
              <PlaceholderPickerButton inputRef={textareaRef} />
              <ChannelMentionInsertButton textareaRef={textareaRef} />
              <RoleMentionInsertButton textareaRef={textareaRef} />
              <EmojiInsertButton textareaRef={textareaRef} />
            </div>
          </InputGroupAddon>
        </InputGroup>
        <ControlledFieldError />
      </ControlledField>
    </EditorCard>
  );
}

type TextareaInsertComponentProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

function RoleMentionInsertButton({ textareaRef }: TextareaInsertComponentProps) {
  const { roles } = useContext(DiscordMessageContext);
  const { open, setOpen, handleSelect, handleOpenChangeComplete } = useTextInputInsert(textareaRef);

  if (!roles) return null;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<InputGroupButton size='icon-xs' />} />}
        >
          <AtSignIcon />
        </TooltipTrigger>
        <TooltipContent>メンション</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className='max-h-100 no-scrollbar' align='end'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>全般</DropdownMenuLabel>
          <DropdownMenuItem className='gap-1.5' onClick={() => handleSelect('@everyone')}>
            <AtSignIcon className='mt-0.5 text-muted-foreground' />
            everyone
          </DropdownMenuItem>
          <DropdownMenuItem className='gap-1.5' onClick={() => handleSelect('@here')}>
            <AtSignIcon className='mt-0.5 text-muted-foreground' />
            here
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>ロール</DropdownMenuLabel>
          {roles.map((role) => (
            <DropdownMenuItem
              onClick={() => handleSelect(`<@&${role.id}> `)}
              className='flex justify-between'
              key={role.id}
            >
              <div className='flex items-center gap-2.5'>
                <RoleColor colors={role.colors} />
                {role.name}
              </div>
              {role.managed && (
                <Tooltip>
                  <TooltipTrigger>
                    <BotIcon className='text-muted-foreground' />
                  </TooltipTrigger>
                  <TooltipContent>自動で管理されたロール</TooltipContent>
                </Tooltip>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChannelMentionInsertButton({ textareaRef }: TextareaInsertComponentProps) {
  const { channels } = useContext(DiscordMessageContext);
  const { open, setOpen, handleSelect, handleOpenChangeComplete } = useTextInputInsert(textareaRef);

  const { categories, groupedChannels, uncategorized } = useMemo(
    () => groupChannelsByCategory(channels ?? []),
    [channels],
  );

  if (!channels) return null;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<InputGroupButton size='icon-xs' />} />}
        >
          <HashIcon />
        </TooltipTrigger>
        <TooltipContent>チャンネル</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className='max-h-100 no-scrollbar' align='end'>
        {uncategorized.length > 0 && (
          <DropdownMenuGroup>
            {uncategorized.map((ch) => (
              <DropdownMenuItem onClick={() => handleSelect(`<#${ch.id}> `)} key={ch.id}>
                <ChannelTypeIcon type={ch.type} />
                {ch.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        {categories.map((category, index) => {
          const channelsInCategory = groupedChannels.get(category.id) ?? [];
          if (channelsInCategory.length === 0) return null;
          return (
            <Fragment key={category.id}>
              {(index > 0 || uncategorized.length > 0) && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel>{category.name}</DropdownMenuLabel>
                {channelsInCategory.map((ch) => (
                  <DropdownMenuItem onClick={() => handleSelect(`<#${ch.id}> `)} key={ch.id}>
                    <ChannelTypeIcon type={ch.type} />
                    {ch.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmojiInsertButton({ textareaRef }: TextareaInsertComponentProps) {
  const { emojis } = useContext(DiscordMessageContext);
  const { open, setOpen, handleSelect } = useTextInputInsert(textareaRef);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger render={<PopoverTrigger render={<InputGroupButton size='icon-xs' />} />}>
          <SmileIcon />
        </TooltipTrigger>
        <TooltipContent>絵文字</TooltipContent>
      </Tooltip>
      <PopoverPanel side='top' align='end' initialFocus={false} finalFocus={false}>
        <DiscordEmojiPicker guildEmojis={emojis} onEmojiSelect={handleSelect} />
      </PopoverPanel>
    </Popover>
  );
}
