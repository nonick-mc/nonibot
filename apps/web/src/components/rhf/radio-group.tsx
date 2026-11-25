'use client';

import type { ComponentProps } from 'react';
import { RadioGroup } from '../ui/radio-group';
import { useControlledField } from './field';

export function ControlledRadioGroup(props: ComponentProps<typeof RadioGroup>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <RadioGroup
      name={field.name}
      value={field.value}
      onValueChange={field.onChange}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled || isSubmitting}
      {...props}
    />
  );
}
