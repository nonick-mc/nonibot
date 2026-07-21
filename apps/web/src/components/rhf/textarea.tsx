'use client';

import type { ComponentProps } from 'react';
import { Textarea } from '../ui/textarea';
import { useControlledField } from './field';

export function ControlledTextarea(props: ComponentProps<typeof Textarea>) {
  const { field, fieldState } = useControlledField();
  return (
    <Textarea
      {...field}
      id={field.name}
      aria-invalid={fieldState.invalid}
      {...props}
    />
  );
}
