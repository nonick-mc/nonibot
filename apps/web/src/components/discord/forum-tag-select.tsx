'use client';

import type { APIGuildForumTag } from 'discord-api-types/v10';
import { useMemo } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '../ui/combobox';
import { InputGroupAddon } from '../ui/input-group';
import { Emoji, Twemoji } from './preview/markdown';

type ForumTagSelectProps = {
  items: APIGuildForumTag[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
};

export function ForumTagSelect({
  items,
  value,
  onChange,
  name,
  disabled,
  invalid,
}: ForumTagSelectProps) {
  const selectedTag = useMemo(() => items.find((tag) => tag.id === value) ?? null, [items, value]);
  const anchor = useComboboxAnchor();

  return (
    <Combobox<APIGuildForumTag>
      items={items}
      value={selectedTag}
      onValueChange={(tag) => onChange?.(tag?.id ?? null)}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      disabled={disabled}
    >
      <div ref={anchor} className='w-fit'>
        <ComboboxInput
          className='sm:min-w-xs'
          placeholder='タグを選択'
          name={name}
          disabled={disabled}
          aria-invalid={invalid}
        >
          {selectedTag && (
            <InputGroupAddon>
              <ForumTagEmoji tag={selectedTag} />
            </InputGroupAddon>
          )}
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>タグが見つかりません</ComboboxEmpty>
        <ComboboxList>
          {items.map((tag) => (
            <ComboboxItem key={tag.id} value={tag}>
              <ForumTagEmoji tag={tag} />
              <span className='truncate'>{tag.name}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ForumTagEmoji({ tag }: { tag: APIGuildForumTag }) {
  if (tag.emoji_name) return <Twemoji name={tag.emoji_name} />;
  if (tag.emoji_id) return <Emoji id={tag.emoji_id} name={tag.name} animated={false} />;
  return null;
}
