import type { ComponentProps } from 'react';
import { ChannelSelect } from '../discord/channel-select';
import { useControlledField } from './field';

export function ControlledChannelSelect(props: ComponentProps<typeof ChannelSelect>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <ChannelSelect
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      disabled={field.disabled || isSubmitting}
      invalid={fieldState.invalid}
      {...props}
    />
  );
}
