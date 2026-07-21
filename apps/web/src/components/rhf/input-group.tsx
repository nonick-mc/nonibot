'use client';

import type { ComponentProps } from 'react';
import { InputGroupInput } from '../ui/input-group';
import { useControlledField } from './field';

export function ControlledInputGroupInput(props: ComponentProps<typeof InputGroupInput>) {
  const { field, fieldState } = useControlledField();
  return (
    <InputGroupInput {...field} id={field.name} aria-invalid={fieldState.invalid} {...props} />
  );
}
