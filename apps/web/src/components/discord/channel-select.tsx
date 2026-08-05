'use client';

import {
  type APIGuildCategoryChannel,
  type APIGuildChannel,
  ChannelType,
  type GuildChannelType,
} from 'discord-api-types/v10';
import { Fragment, useMemo } from 'react';
import { groupChannelsByCategory } from '@/lib/discord/utils';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  useComboboxAnchor,
  useComboboxFilteredItems,
} from '../ui/combobox';
import { InputGroupAddon } from '../ui/input-group';
import { ChannelTypeIcon } from './channel-type-icon';

type ChannelSelectProps = {
  items: APIGuildChannel<GuildChannelType>[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  includeTypes?: ChannelType[];
  excludeTypes?: ChannelType[];
};

export function ChannelSelect({
  items,
  value,
  onChange,
  name,
  disabled,
  invalid,
  includeTypes,
  excludeTypes,
}: ChannelSelectProps) {
  const selectedChannel = useMemo(
    () => items.find((ch) => ch.id === value) ?? null,
    [items, value],
  );
  const anchor = useComboboxAnchor();

  const relevantItems = useMemo(
    () =>
      items.filter(
        (ch) =>
          ch.type === ChannelType.GuildCategory ||
          ((!includeTypes || includeTypes.includes(ch.type)) && !excludeTypes?.includes(ch.type)),
      ),
    [items, includeTypes, excludeTypes],
  );

  const isCategorySelectable =
    (!includeTypes || includeTypes.includes(ChannelType.GuildCategory)) &&
    !excludeTypes?.includes(ChannelType.GuildCategory);

  const { categories, groupedChannels, uncategorized } = useMemo(
    () => groupChannelsByCategory(relevantItems, isCategorySelectable),
    [relevantItems, isCategorySelectable],
  );

  const selectableItems = useMemo(
    () => uncategorized.concat(...groupedChannels.values()),
    [uncategorized, groupedChannels],
  );

  return (
    <Combobox<APIGuildChannel<GuildChannelType>>
      items={selectableItems}
      value={selectedChannel}
      onValueChange={(channel) => onChange?.(channel?.id ?? null)}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
    >
      <div ref={anchor} className='w-fit'>
        <ComboboxInput
          className='sm:min-w-xs'
          placeholder='チャンネルを選択'
          name={name}
          disabled={disabled}
          aria-invalid={invalid}
        >
          {selectedChannel && (
            <InputGroupAddon>
              <ChannelTypeIcon type={selectedChannel.type} />
            </InputGroupAddon>
          )}
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>チャンネルが見つかりません</ComboboxEmpty>
        <ChannelComboboxList categories={categories} isCategorySelectable={isCategorySelectable} />
      </ComboboxContent>
    </Combobox>
  );
}

type ChannelComboboxListProps = {
  categories: APIGuildCategoryChannel[];
  isCategorySelectable: boolean;
};

function ChannelComboboxList({ categories, isCategorySelectable }: ChannelComboboxListProps) {
  const filteredItems = useComboboxFilteredItems<APIGuildChannel<GuildChannelType>>();

  const { groupedChannels, uncategorized } = useMemo(
    () => groupChannelsByCategory(filteredItems, isCategorySelectable),
    [filteredItems, isCategorySelectable],
  );

  return (
    <ComboboxList>
      {uncategorized.map((ch) => (
        <ComboboxItem key={ch.id} value={ch}>
          <ChannelTypeIcon type={ch.type} />
          {ch.name}
        </ComboboxItem>
      ))}
      {categories.map((category, index) => {
        const channels = groupedChannels.get(category.id) ?? [];
        if (channels.length === 0) return null;
        return (
          <Fragment key={category.id}>
            {(index > 0 || uncategorized.length > 0) && <ComboboxSeparator />}
            <ComboboxGroup>
              <ComboboxLabel>{category.name}</ComboboxLabel>
              {channels.map((ch) => (
                <ComboboxItem key={ch.id} value={ch}>
                  <ChannelTypeIcon type={ch.type} />
                  {ch.name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </Fragment>
        );
      })}
    </ComboboxList>
  );
}
