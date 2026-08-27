import type { ComponentProps } from 'react';
import { ComponentsV2EditorDialog } from '../discord/components-v2-editor/dialog';
import type { DialogTrigger } from '../ui/dialog';
import { useControlledField } from './field';

export function ControlledComponentsV2EditorDialog({
  children,
}: {
  children: ComponentProps<typeof DialogTrigger>['render'];
}) {
  const { field } = useControlledField();
  return (
    <ComponentsV2EditorDialog onSubmit={field.onChange} defaultValues={field.value}>
      {children}
    </ComponentsV2EditorDialog>
  );
}
