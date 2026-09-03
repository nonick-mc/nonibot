'use client';

import type { APIRole } from 'discord-api-types/v10';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '../ui/combobox';
import { InputGroupAddon } from '../ui/input-group';
import { RoleColor } from './role-color';

type RoleSelectCommonProps = {
  items: APIRole[];
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

type RoleSelectMultipleProps = RoleSelectCommonProps & {
  multiple: true;
  value?: string[] | null;
  onChange?: (value: string[]) => void;
};

type RoleSelectSingleProps = RoleSelectCommonProps & {
  multiple?: false;
  value?: string | null;
  onChange?: (value: string | null) => void;
};

type RoleSelectProps = RoleSelectMultipleProps | RoleSelectSingleProps;

export function RoleSelect(props: RoleSelectProps) {
  if (props.multiple) return <RoleSelectMultiple {...props} />;
  return <RoleSelectSingle {...props} />;
}

function RoleSelectMultiple({
  items,
  value,
  onChange,
  name,
  disabled,
  invalid,
  className,
}: RoleSelectMultipleProps) {
  const selectedRoles = useMemo(
    () => items.filter((role) => value?.includes(role.id)),
    [items, value],
  );
  const anchor = useComboboxAnchor();

  return (
    <Combobox<APIRole, true>
      items={items}
      multiple
      value={selectedRoles}
      onValueChange={(roles) => onChange?.(roles.map((role) => role.id))}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className={cn('px-3', { 'opacity-50': disabled }, className)}>
        {selectedRoles.map((role) => (
          <ComboboxChip key={role.id} aria-label={role.name}>
            <RoleColor colors={role.colors} />
            <span className='truncate'>{role.name}</span>
          </ComboboxChip>
        ))}
        <ComboboxChipsInput
          placeholder={selectedRoles.length ? '' : 'ロールを選択'}
          name={name}
          disabled={disabled}
          aria-invalid={invalid}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>ロールが見つかりません</ComboboxEmpty>
        <ComboboxList>
          {items.map((role) => (
            <ComboboxItem key={role.id} value={role}>
              <RoleColor colors={role.colors} />
              <span className='truncate'>{role.name}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function RoleSelectSingle({
  items,
  value,
  onChange,
  name,
  disabled,
  invalid,
  className,
}: RoleSelectSingleProps) {
  const selectedRole = useMemo(
    () => items.find((role) => role.id === value) ?? null,
    [items, value],
  );
  const anchor = useComboboxAnchor();

  return (
    <Combobox<APIRole>
      items={items}
      value={selectedRole}
      onValueChange={(role) => onChange?.(role?.id ?? null)}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      disabled={disabled}
    >
      <div ref={anchor} className='w-fit'>
        <ComboboxInput
          className={className}
          placeholder='ロールを選択'
          name={name}
          disabled={disabled}
          aria-invalid={invalid}
        >
          {selectedRole && (
            <InputGroupAddon>
              <RoleColor colors={selectedRole.colors} />
            </InputGroupAddon>
          )}
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>ロールが見つかりません</ComboboxEmpty>
        <ComboboxList>
          {items.map((role) => (
            <ComboboxItem key={role.id} value={role}>
              <RoleColor colors={role.colors} />
              <span className='truncate'>{role.name}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
