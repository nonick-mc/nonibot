'use client';

import type { ComponentProps } from 'react';
import { Input } from '../ui/input';
import { useControlledField } from './field';

export function ControlledInput(props: ComponentProps<typeof Input>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <Input
      {...field}
      id={field.name}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled || isSubmitting}
      {...props}
    />
  );
}
