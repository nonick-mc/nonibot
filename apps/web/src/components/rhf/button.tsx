import type { ComponentProps } from 'react';
import { Button } from '../ui/button';
import { useControlledField } from './field';

export function ControlledButton({ disabled, ...props }: ComponentProps<typeof Button>) {
  const { field, isSubmitting } = useControlledField();
  return <Button disabled={disabled || field.disabled || isSubmitting} {...props} />;
}
