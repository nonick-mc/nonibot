'use client';

import type { ComponentProps } from 'react';
import { Checkbox } from '../ui/checkbox';
import { useControlledField } from './field';

export function ControlledCheckbox(props: ComponentProps<typeof Checkbox>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <Checkbox
      id={field.name}
      name={field.name}
      checked={field.value}
      onCheckedChange={field.onChange}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled || isSubmitting}
      {...props}
    />
  );
}
