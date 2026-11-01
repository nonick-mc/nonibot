'use client';

import type { ComponentProps } from 'react';
import { RoleSelect } from '../discord/role-select';
import { useControlledField } from './field';

export function ControlledRoleSelect(props: ComponentProps<typeof RoleSelect>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <RoleSelect
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      disabled={field.disabled || isSubmitting}
      invalid={fieldState.invalid}
      {...props}
    />
  );
}
