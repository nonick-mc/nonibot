'use client';

import type { ComponentProps } from 'react';
import { Switch } from '../ui/switch';
import { useControlledField } from './field';

export function ControlledSwitch(props: ComponentProps<typeof Switch>) {
  const { field, fieldState } = useControlledField();
  return (
    <Switch
      id={field.name}
      name={field.name}
      checked={field.value}
      onCheckedChange={field.onChange}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled}
      {...props}
    />
  );
}
