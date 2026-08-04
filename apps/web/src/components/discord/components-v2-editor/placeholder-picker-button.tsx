'use client';

import { BracesIcon, LinkIcon } from 'lucide-react';
import { type RefObject, useContext, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroupButton } from '@/components/ui/input-group';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DiscordMessageContext } from '../message-context';

export type TextInputRef = RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
export type TextInputInsertMode = 'insert' | 'replace';

export function useTextInputInsert(inputRef: TextInputRef, mode: TextInputInsertMode = 'insert') {
  const [open, setOpen] = useState(false);

  function handleSelect(text: string) {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    if (mode === 'replace') {
      input.select();
    }
    document.execCommand('insertText', false, text);
    setOpen(false);
  }

  return { open, setOpen, handleSelect };
}

type PlaceholderPickerButtonProps = {
  inputRef: TextInputRef;
  urlOnly?: boolean;
  mode?: TextInputInsertMode;
};

export function PlaceholderPickerButton({ inputRef, urlOnly, mode }: PlaceholderPickerButtonProps) {
  const { placeholders } = useContext(DiscordMessageContext);
  const { open, setOpen, handleSelect } = useTextInputInsert(inputRef, mode);
  const items = urlOnly ? placeholders?.filter((p) => p.isUrl) : placeholders;

  if (!items?.length) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<InputGroupButton size='icon-xs' />} />}
        >
          <BracesIcon />
        </TooltipTrigger>
        <TooltipContent>プレースホルダー</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align='end' className='max-w-md w-full'>
        <DropdownMenuGroup>
          {items.map(({ key, description, isUrl }) => (
            <DropdownMenuItem key={key} onClick={() => handleSelect(`{{${key}}}`)}>
              <Item size='xs'>
                <ItemMedia className='self-center! text-muted-foreground'>
                  {isUrl ? <LinkIcon /> : <BracesIcon />}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className='font-mono'>{key}</ItemTitle>
                  <ItemDescription className='text-xs'>{description}</ItemDescription>
                </ItemContent>
              </Item>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
