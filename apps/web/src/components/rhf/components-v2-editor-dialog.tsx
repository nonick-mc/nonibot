import type { ComponentProps } from 'react';
import { ComponentsV2EditorDialog } from '../discord/components-v2-editor/dialog';
import type { MessageResources } from '../discord/resources';
import type { DialogTrigger } from '../ui/dialog';
import { useControlledField } from './field';

export function ControlledComponentsV2EditorDialog({
  resources,
  children,
}: {
  resources?: MessageResources;
  children: ComponentProps<typeof DialogTrigger>['render'];
}) {
  const { field } = useControlledField();
  return (
    <ComponentsV2EditorDialog
      onSubmit={(values) => {
        field.onChange(values);
        return true;
      }}
      defaultValues={field.value}
      resources={resources}
    >
      {children}
    </ComponentsV2EditorDialog>
  );
}
