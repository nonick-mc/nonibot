import type { ComponentProps } from 'react';
import { Toggle } from '../ui/toggle';
import { useControlledField } from './field';

export function ControlledToggle(props: ComponentProps<typeof Toggle>) {
  const { field, isSubmitting } = useControlledField();
  return (
    <Toggle
      id={field.name}
      name={field.name}
      pressed={field.value}
      onPressedChange={field.onChange}
      disabled={field.disabled || isSubmitting}
      {...props}
    />
  );
}
