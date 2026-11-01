'use client';

import type { ComponentType } from 'react';
import { useControlledField } from '@/components/rhf/field';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

type Option<T extends string | number> = {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

type OptionMultiSelectProps<T extends string | number> = {
  options: readonly Option<T>[];
  placeholder: string;
  emptyText: string;
  className?: string;
};

// 固定の選択肢から複数選択するフィールド
export function ControlledOptionMultiSelect<T extends string | number>({
  options,
  placeholder,
  emptyText,
  className,
}: OptionMultiSelectProps<T>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  const disabled = field.disabled || isSubmitting;
  const anchor = useComboboxAnchor();
  const value: T[] = field.value ?? [];
  const selected = options.filter((option) => value.includes(option.value));

  return (
    <Combobox<Option<T>, true>
      items={[...options]}
      multiple
      value={selected}
      onValueChange={(items) => field.onChange(items.map((item) => item.value))}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => String(item.value)}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className={cn('px-3', { 'opacity-50': disabled }, className)}>
        {selected.map((option) => (
          <ComboboxChip key={option.value} aria-label={option.label}>
            {option.icon && <option.icon className='size-4' />}
            <span className='truncate'>{option.label}</span>
          </ComboboxChip>
        ))}
        <ComboboxChipsInput
          placeholder={selected.length ? '' : placeholder}
          name={field.name}
          disabled={disabled}
          aria-invalid={fieldState.invalid}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {options.map((option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon && <option.icon className='size-4 text-muted-foreground' />}
              <span className='truncate'>{option.label}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
