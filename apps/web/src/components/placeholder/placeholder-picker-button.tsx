'use client';

import type { Placeholder, PlaceholderType } from '@repo/placeholders';
import { AtSignIcon, BracesIcon, LinkIcon } from 'lucide-react';
import { type ReactNode, type RefObject, useState } from 'react';
import { Badge } from '@/components/reui/badge';
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

  function handleOpenChangeComplete(isOpen: boolean) {
    if (isOpen) return;
    inputRef.current?.focus();
  }

  return { open, setOpen, handleSelect, handleOpenChangeComplete };
}

const PlaceholderIcons = {
  text: <BracesIcon />,
  mention: <AtSignIcon />,
  url: <LinkIcon />,
} satisfies Record<PlaceholderType, ReactNode>;

export type PlaceholderPickerButtonProps = {
  placeholders?: Placeholder;
  inputRef: TextInputRef;
  types?: PlaceholderType[];
  mode?: TextInputInsertMode;
};

export function PlaceholderPickerButton({
  placeholders,
  inputRef,
  types,
  mode,
}: PlaceholderPickerButtonProps) {
  const { open, setOpen, handleSelect, handleOpenChangeComplete } = useTextInputInsert(
    inputRef,
    mode,
  );
  const items = types ? placeholders?.filter((p) => types.includes(p.type)) : placeholders;

  if (!items?.length) return null;

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
          <BracesIcon />
        </TooltipTrigger>
        <TooltipContent>プレースホルダー</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align='end' className='min-w-64'>
        <DropdownMenuGroup>
          {items.map(({ key, description, type, deprecated }) => (
            <DropdownMenuItem key={key} onClick={() => handleSelect(`{{${key}}}`)}>
              <Item size='xs'>
                <ItemMedia className='self-center! text-muted-foreground'>
                  {PlaceholderIcons[type]}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className='inline-flex font-mono gap-2'>
                    {key}
                    {deprecated && (
                      <Badge size='sm' variant='warning-light' className='text-warning-foreground!'>
                        非推奨
                      </Badge>
                    )}
                  </ItemTitle>
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
