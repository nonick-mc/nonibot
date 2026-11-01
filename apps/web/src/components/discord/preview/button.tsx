import { ButtonStyle } from 'discord-api-types/v10';
import { ExternalLinkIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../../ui/button';
import { Emoji, Twemoji } from './markdown';

type DiscordButtonEmoji = { id?: string; name: string; animated?: boolean };

// Secondary・Linkはshadcn/uiのoutlineボタンをそのまま使用する
const ButtonStyleClass: Partial<Record<ButtonStyle, string>> = {
  [ButtonStyle.Primary]: 'bg-discord-primary text-white hover:bg-discord-primary/80',
  [ButtonStyle.Success]: 'bg-discord-success text-white hover:bg-discord-success/80',
  [ButtonStyle.Danger]: 'bg-discord-danger text-white hover:bg-discord-danger/80',
};

export function DiscordButtonEmoji({ id, name, animated }: DiscordButtonEmoji) {
  return id ? <Emoji id={id} name={name} animated={!!animated} /> : <Twemoji name={name} />;
}

type DiscordButtonProps = Omit<ComponentProps<typeof Button>, 'style'> & {
  buttonStyle: ButtonStyle;
  label?: string;
  emoji?: DiscordButtonEmoji | null;
};

export function DiscordButton({
  buttonStyle,
  label,
  emoji,
  className,
  ...props
}: DiscordButtonProps) {
  if (!label && !emoji) return null;

  return (
    <Button
      type='button'
      size='sm'
      variant={
        buttonStyle === ButtonStyle.Secondary || buttonStyle === ButtonStyle.Link
          ? 'outline'
          : 'default'
      }
      className={cn(
        'max-w-full rounded-lg py-0.75 px-2.75 [&_img]:size-4.5!',
        ButtonStyleClass[buttonStyle],
        className,
      )}
      {...props}
    >
      {emoji && (
        <span className='flex shrink-0'>
          <DiscordButtonEmoji {...emoji} />
        </span>
      )}
      {label && <span className='truncate text-sm'>{label}</span>}
      {buttonStyle === ButtonStyle.Link && <ExternalLinkIcon />}
    </Button>
  );
}
