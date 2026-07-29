import { EmojiPicker as EmojiPickerPrimitive } from '@ferrucc-io/emoji-picker';
import { SearchIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { InputGroup, InputGroupAddon } from './input-group';

const EmojiPickerGroup = EmojiPickerPrimitive.Group;
const EmojiPickerList = EmojiPickerPrimitive.List;

function EmojiPicker({ className, ...props }: ComponentProps<typeof EmojiPickerPrimitive>) {
  return (
    <EmojiPickerPrimitive
      className={cn('bg-card max-w-sm border focus:ring-[3px] focus:ring-ring/50', className)}
      {...props}
    />
  );
}

function EmojiPickerHeader({
  className,
  ...props
}: ComponentProps<typeof EmojiPickerPrimitive.Header>) {
  return <EmojiPickerPrimitive.Header className={cn('pb-2', className)} {...props} />;
}

function EmojiPickerInput({
  className,
  placeholder,
  ...props
}: ComponentProps<typeof EmojiPickerPrimitive.Input>) {
  return (
    <InputGroup>
      <EmojiPickerPrimitive.Input
        data-slot='input-group-control'
        className={cn(
          'h-9 w-full min-w-0 rounded-xl border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 disabled:opacity-100 dark:bg-transparent',
          className,
        )}
        placeholder='絵文字を検索'
        hideIcon
        {...props}
      />
      <InputGroupAddon align='inline-start'>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}

export { EmojiPicker, EmojiPickerGroup, EmojiPickerHeader, EmojiPickerInput, EmojiPickerList };
