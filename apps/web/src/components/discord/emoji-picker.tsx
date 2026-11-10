'use client';

import type { InternalApiEmoji } from '@repo/shared/types';
import { CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import { type ComponentProps, type ReactNode, type RefObject, useMemo } from 'react';
import twemoji from 'twemoji';
import { useCurrentGuild } from '@/components/discord/current-guild';
import { LogoIcon } from '@/components/logo';
import {
  EMOJI_PICKER_CATEGORIES,
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerTrigger,
} from '@/components/reui/emoji-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type DiscordEmojiPickerProps = {
  guildEmojis?: InternalApiEmoji[];
  applicationEmojis?: InternalApiEmoji[];
  onEmojiSelect?: (emoji: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  returnFocus?: RefObject<HTMLElement | null>;
  side?: ComponentProps<typeof EmojiPickerContent>['side'];
  align?: ComponentProps<typeof EmojiPickerContent>['align'];
};

const TwemojiBaseUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

function twemojiUrl(value: string) {
  const raw = value.includes('\u200d') ? value : value.replace(/\uFE0F/g, '');
  return `${TwemojiBaseUrl}/${twemoji.convert.toCodePoint(raw)}.svg`;
}

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
const AppCategory = 'application';
const CustomCategory = [
  { id: GuildCategory, label: 'サーバー絵文字' },
  { id: AppCategory, label: 'nonibot', icon: <LogoIcon aria-hidden='true' /> },
];
const NoEmojis: InternalApiEmoji[] = [];

function toCustomEmojis(emojis: InternalApiEmoji[], category: string) {
  return [...emojis]
    .sort((a, b) => (a.name as string).localeCompare(b.name as string))
    .map((emoji) => ({
      id: emoji.id,
      label: emoji.name as string,
      shortcodes: [emoji.name as string],
      category,
      src: `${RouteBases.cdn}/${CDNRoutes.emoji(emoji.id, emoji.animated ? ImageFormat.GIF : ImageFormat.WebP)}`,
    }));
}

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

function renderEmoji(emoji: { src?: string }, value: string) {
  return (
    // biome-ignore lint/performance/noImgElement: CDN画像
    <img
      src={emoji.src ?? twemojiUrl(value)}
      alt=''
      draggable={false}
      loading='lazy'
      className='size-[1em] object-contain'
    />
  );
}

export function DiscordEmojiPicker({
  guildEmojis = NoEmojis,
  applicationEmojis = NoEmojis,
  onEmojiSelect,
  open,
  onOpenChange,
  children,
  returnFocus,
  side = 'top',
  align = 'start',
}: DiscordEmojiPickerProps) {
  const guild = useCurrentGuild();
  const customCategories = useMemo(
    () =>
      guild
        ? CustomCategory.map((category) =>
            category.id === GuildCategory
              ? {
                  ...category,
                  icon: (
                    <Avatar className='size-4'>
                      <AvatarImage
                        src={
                          guild.icon
                            ? RouteBases.cdn +
                              CDNRoutes.guildIcon(guild.id, guild.icon, ImageFormat.WebP)
                            : undefined
                        }
                      />
                      <AvatarFallback className='text-[0.5rem]'>
                        {guild.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ),
                }
              : category,
          )
        : CustomCategory,
    [guild],
  );
  const customEmojis = useMemo(
    () => [
      ...toCustomEmojis(guildEmojis, GuildCategory),
      ...toCustomEmojis(applicationEmojis, AppCategory),
    ],
    [guildEmojis, applicationEmojis],
  );
  const categories = useMemo(
    () => [
      ...CustomCategory.map((c) => c.id).filter((id) =>
        customEmojis.some((e) => e.category === id),
      ),
      ...EMOJI_PICKER_CATEGORIES,
    ],
    [customEmojis],
  );

  return (
    <EmojiPicker
      columns={9}
      locale='ja'
      i18n={i18n}
      customEmojis={customEmojis}
      customCategories={customCategories}
      categories={categories}
      value={null}
      emojiVersion={14}
      renderEmoji={renderEmoji}
      open={open}
      onOpenChange={onOpenChange}
      recentLimit={0}
      recentStorageKey={null}
      onEmojiSelect={({ value, emoji }) => {
        const source =
          emoji.category === GuildCategory
            ? guildEmojis
            : emoji.category === AppCategory
              ? applicationEmojis
              : undefined;
        const custom = source?.find((e) => e.id === emoji.id);
        onEmojiSelect?.(
          custom ? `<${custom.animated ? 'a' : ''}:${custom.name}:${custom.id}>` : value,
        );
      }}
    >
      {children}
      <EmojiPickerContent side={side} align={align} returnFocus={returnFocus} />
    </EmojiPicker>
  );
}
