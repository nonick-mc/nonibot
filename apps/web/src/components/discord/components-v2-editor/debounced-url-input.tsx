'use client';

import { type RefObject, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { useControlledField } from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';

type DebouncedUrlInputProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  placeholder?: string;
};

export function DebouncedUrlInput({ inputRef, placeholder }: DebouncedUrlInputProps) {
  const { field } = useControlledField();
  const [value, setValue] = useState(field.value ?? '');
  const debouncedOnChange = useDebounceCallback(field.onChange, 300);

  return (
    <ControlledInputGroupInput
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        debouncedOnChange(event.target.value);
      }}
    />
  );
}
