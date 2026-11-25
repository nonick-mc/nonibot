'use client';

import type { ComponentProps } from 'react';
import { Input } from '../ui/input';
import { InputGroupInput } from '../ui/input-group';
import { useControlledField } from './field';

/** 値を number で扱う入力欄の props。空欄は NaN になる */
function useNumberInputProps() {
  const { field, fieldState, isSubmitting } = useControlledField();
  return {
    type: 'number',
    inputMode: 'numeric',
    id: field.name,
    name: field.name,
    ref: field.ref,
    onBlur: field.onBlur,
    value: Number.isNaN(field.value) ? '' : field.value,
    onChange: (e) => field.onChange(e.target.valueAsNumber),
    'aria-invalid': fieldState.invalid,
    disabled: field.disabled || isSubmitting,
  } satisfies ComponentProps<'input'>;
}

export function ControlledNumberInput(props: Omit<ComponentProps<typeof Input>, 'type'>) {
  return <Input {...useNumberInputProps()} {...props} />;
}

export function ControlledInputGroupNumberInput(
  props: Omit<ComponentProps<typeof InputGroupInput>, 'type'>,
) {
  return <InputGroupInput {...useNumberInputProps()} {...props} />;
}
