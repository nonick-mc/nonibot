'use client';

import type { CustomSection } from '@ferrucc-io/emoji-picker';
import { type APIEmoji, CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import { useMemo } from 'react';
import {
  EmojiPicker,
  EmojiPickerGroup,
  EmojiPickerHeader,
  EmojiPickerInput,
  EmojiPickerList,
} from '../ui/emoji-picker';

type DiscordEmojiPickerProps = {
  guildEmojis?: APIEmoji[];
  onEmojiSelect?: (emoji: string) => void;
};

export function DiscordEmojiPicker({ guildEmojis = [], onEmojiSelect }: DiscordEmojiPickerProps) {
  const customSections: CustomSection[] = [];

  if (guildEmojis.length) {
    customSections.push({
      id: 'custom',
      name: 'サーバー絵文字',
      priority: 1,
      emojis: [...guildEmojis]
        .sort((a, b) => (a.name as string).localeCompare(b.name as string))
        .map((emoji) => ({
          id: emoji.id as string,
          name: emoji.name as string,
          imageUrl: `${RouteBases.cdn}/${CDNRoutes.emoji(emoji.id as string, emoji.animated ? ImageFormat.GIF : ImageFormat.WebP)}`,
        })),
    });
  }

  const guildEmojiByName = useMemo(
    () => new Map(guildEmojis.map((emoji) => [emoji.name as string, emoji])),
    [guildEmojis],
  );

  function handleEmojiSelect(value: string) {
    const match = /^:(.+):$/.exec(value);
    const emoji = match ? guildEmojiByName.get(match[1]) : undefined;
    onEmojiSelect?.(emoji ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : value);
  }

  return (
    <EmojiPicker
      emojisPerRow={9}
      emojiSize={32}
      customSections={customSections}
      onEmojiSelect={handleEmojiSelect}
    >
      <EmojiPickerHeader>
        <EmojiPickerInput />
      </EmojiPickerHeader>
      <EmojiPickerGroup>
        <EmojiPickerList />
      </EmojiPickerGroup>
    </EmojiPicker>
  );
}
