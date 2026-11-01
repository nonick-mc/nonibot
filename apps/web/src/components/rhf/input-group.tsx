'use client';

import type { ComponentProps } from 'react';
import { mergeRefs } from '@/lib/utils';
import { InputGroupInput, InputGroupTextarea } from '../ui/input-group';
import { useControlledField } from './field';

export function ControlledInputGroupInput({
  ref,
  ...props
}: ComponentProps<typeof InputGroupInput>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <InputGroupInput
      {...field}
      id={field.name}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled || isSubmitting}
      {...props}
      ref={mergeRefs(field.ref, ref)}
    />
  );
}

export function ControlledInputGroupTextarea({
  ref,
  ...props
}: ComponentProps<typeof InputGroupTextarea>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <InputGroupTextarea
      {...field}
      id={field.name}
      aria-invalid={fieldState.invalid}
      disabled={field.disabled || isSubmitting}
      {...props}
      ref={mergeRefs(field.ref, ref)}
    />
  );
}
