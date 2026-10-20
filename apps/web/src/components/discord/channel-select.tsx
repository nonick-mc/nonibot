'use client';

import type { InternalApiChannel } from '@repo/shared';
import { ChannelType } from 'discord-api-types/v10';
import { Fragment, useMemo } from 'react';
import { groupChannelsByCategory } from '@/lib/discord/utils';
import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
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

type ChannelSelectCommonProps = {
  items: InternalApiChannel[];
  name?: string;
  disabled?: boolean;
  disabledItemFilter?: (value: InternalApiChannel) => boolean;
  invalid?: boolean;
  includeTypes?: ChannelType[];
  excludeTypes?: ChannelType[];
  className?: string;
};

type ChannelSelectMultipleProps = ChannelSelectCommonProps & {
  multiple: true;
  value?: string[] | null;
  onChange?: (value: string[]) => void;
};

type ChannelSelectSingleProps = ChannelSelectCommonProps & {
  multiple?: false;
  value?: string | null;
  onChange?: (value: string | null) => void;
};

type ChannelSelectProps = ChannelSelectMultipleProps | ChannelSelectSingleProps;

export function ChannelSelect(props: ChannelSelectProps) {
  if (props.multiple) return <ChannelSelectMultiple {...props} />;
  return <ChannelSelectSingle {...props} />;
}

function useSelectableChannels(
  items: InternalApiChannel[],
  includeTypes?: ChannelType[],
  excludeTypes?: ChannelType[],
) {
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

  return { categories, isCategorySelectable, selectableItems };
}

function ChannelSelectMultiple({
  items,
  value,
  onChange,
  name,
  disabled,
  disabledItemFilter,
  invalid,
  includeTypes,
  excludeTypes,
  className,
}: ChannelSelectMultipleProps) {
  const selectedChannels = useMemo(
    () => items.filter((ch) => value?.includes(ch.id)),
    [items, value],
  );
  const anchor = useComboboxAnchor();
  const { categories, isCategorySelectable, selectableItems } = useSelectableChannels(
    items,
    includeTypes,
    excludeTypes,
  );

  return (
    <Combobox<InternalApiChannel, true>
      items={selectableItems}
      multiple
      value={selectedChannels}
      onValueChange={(channels) => onChange?.(channels.map((ch) => ch.id))}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className={cn('px-3', { 'opacity-50': disabled }, className)}>
        {selectedChannels.map((ch) => (
          <ComboboxChip key={ch.id} aria-label={ch.name}>
            <ChannelTypeIcon className='size-4' type={ch.type} />
            <span className='truncate'>{ch.name}</span>
          </ComboboxChip>
        ))}
        <ComboboxChipsInput
          placeholder={selectedChannels.length ? '' : 'チャンネルを選択'}
          name={name}
          disabled={disabled}
          aria-invalid={invalid}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>チャンネルが見つかりません</ComboboxEmpty>
        <ChannelComboboxList
          categories={categories}
          isCategorySelectable={isCategorySelectable}
          disabledItemFilter={disabledItemFilter}
        />
      </ComboboxContent>
    </Combobox>
  );
}

function ChannelSelectSingle({
  items,
  value,
  onChange,
  name,
  disabled,
  disabledItemFilter,
  invalid,
  includeTypes,
  excludeTypes,
  className,
}: ChannelSelectSingleProps) {
  const selectedChannel = useMemo(
    () => items.find((ch) => ch.id === value) ?? null,
    [items, value],
  );
  const anchor = useComboboxAnchor();
  const { categories, isCategorySelectable, selectableItems } = useSelectableChannels(
    items,
    includeTypes,
    excludeTypes,
  );

  return (
    <Combobox<InternalApiChannel>
      items={selectableItems}
      value={selectedChannel}
      onValueChange={(channel) => onChange?.(channel?.id ?? null)}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
    >
      <div ref={anchor} className='w-fit'>
        <ComboboxInput
          className={className}
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
        <ChannelComboboxList
          categories={categories}
          isCategorySelectable={isCategorySelectable}
          disabledItemFilter={disabledItemFilter}
        />
      </ComboboxContent>
    </Combobox>
  );
}

type ChannelComboboxListProps = {
  categories: InternalApiChannel[];
  isCategorySelectable: boolean;
  disabledItemFilter?: (value: InternalApiChannel) => boolean;
};

function ChannelComboboxList({
  categories,
  isCategorySelectable,
  disabledItemFilter,
}: ChannelComboboxListProps) {
  const filteredItems = useComboboxFilteredItems<InternalApiChannel>();

  const { groupedChannels, uncategorized } = useMemo(
    () => groupChannelsByCategory(filteredItems, isCategorySelectable),
    [filteredItems, isCategorySelectable],
  );

  return (
    <ComboboxList>
      {uncategorized.map((ch) => (
        <ComboboxItem key={ch.id} value={ch} disabled={disabledItemFilter?.(ch)}>
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
                <ComboboxItem key={ch.id} value={ch} disabled={disabledItemFilter?.(ch)}>
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
