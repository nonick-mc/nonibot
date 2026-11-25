import type { Select as SelectPrimitive } from '@base-ui/react/select';
import type { ComponentProps } from 'react';
import { Select, SelectTrigger } from '../ui/select';
import { useControlledField } from './field';

export function ControlledSelect<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  const { field, isSubmitting } = useControlledField();
  return (
    <Select<Value, Multiple>
      name={field.name}
      value={field.value}
      onValueChange={field.onChange}
      disabled={field.disabled || isSubmitting}
      {...props}
    />
  );
}

export function ControlledSelectTrigger(props: ComponentProps<typeof SelectTrigger>) {
  const { field, fieldState } = useControlledField();
  return <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} {...props} />;
}
