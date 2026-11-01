'use client';

import type { ComponentProps } from 'react';
import { Textarea } from '../ui/textarea';
import { useControlledField } from './field';

export function ControlledTextarea(props: ComponentProps<typeof Textarea>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <Textarea
      {...field}
      id={field.name}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled || isSubmitting}
      {...props}
    />
  );
}
