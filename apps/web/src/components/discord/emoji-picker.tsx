'use client';

import { type APIEmoji, CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import type { ComponentProps, ReactNode, RefObject } from 'react';
import {
  EMOJI_PICKER_CATEGORIES,
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerTrigger,
} from '@/components/reui/emoji-picker';
import { cn } from '@/lib/utils';

type DiscordEmojiPickerProps = {
  guildEmojis?: APIEmoji[];
  onEmojiSelect?: (emoji: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  returnFocus?: RefObject<HTMLElement | null>;
  side?: ComponentProps<typeof EmojiPickerContent>['side'];
  align?: ComponentProps<typeof EmojiPickerContent>['align'];
};

export function DiscordEmojiPickerTrigger({
  className,
  ...props
}: ComponentProps<typeof EmojiPickerTrigger>) {
  return (
    <EmojiPickerTrigger
      variant='ghost'
      size='default'
      className={cn('size-6 rounded-xl p-0 shadow-none', className)}
      {...props}
    />
  );
}

const GuildCategory = 'guild';

const i18n = {
  labels: {
    search: '絵文字を検索',
    clearSearch: '検索をクリア',
    list: '絵文字',
    categories: '絵文字カテゴリ',
    searchResults: '検索結果',
    custom: 'サーバー絵文字',
    skinTone: '肌の色',
    empty: '絵文字が見つかりません',
    preview: '絵文字を選択',
  },
};

export function DiscordEmojiPicker({
  guildEmojis = [],
  onEmojiSelect,
  open,
  onOpenChange,
  children,
  returnFocus,
  side = 'top',
  align = 'start',
}: DiscordEmojiPickerProps) {
  const customEmojis = [...guildEmojis]
    .sort((a, b) => (a.name as string).localeCompare(b.name as string))
    .map((emoji) => ({
      id: emoji.id as string,
      label: emoji.name as string,
      shortcodes: [emoji.name as string],
      category: GuildCategory,
      src: `${RouteBases.cdn}/${CDNRoutes.emoji(emoji.id as string, emoji.animated ? ImageFormat.GIF : ImageFormat.WebP)}`,
    }));

  return (
    <EmojiPicker
      columns={9}
      locale='ja'
      i18n={i18n}
      customEmojis={customEmojis}
      customCategories={[{ id: GuildCategory, label: 'サーバー絵文字' }]}
      categories={
        customEmojis.length ? [GuildCategory, ...EMOJI_PICKER_CATEGORIES] : EMOJI_PICKER_CATEGORIES
      }
      value={null}
      open={open}
      onOpenChange={onOpenChange}
      recentLimit={0}
      recentStorageKey={null}
      onEmojiSelect={({ value, emoji }) => {
        const guildEmoji = emoji.src ? guildEmojis.find((e) => e.id === emoji.id) : undefined;
        onEmojiSelect?.(
          guildEmoji
            ? `<${guildEmoji.animated ? 'a' : ''}:${guildEmoji.name}:${guildEmoji.id}>`
            : value,
        );
      }}
    >
      {children}
      <EmojiPickerContent side={side} align={align} returnFocus={returnFocus} />
    </EmojiPicker>
  );
}
