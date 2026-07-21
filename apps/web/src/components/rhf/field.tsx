'use client';

import { type ComponentProps, type ReactNode, createContext, useContext } from 'react';
import {
  type Control,
  type FieldValues,
  type Path,
  type UseControllerReturn,
  useController,
} from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '../ui/field';

type ControlledFieldContextValue = UseControllerReturn<FieldValues>;

export const ControlledFieldContext = createContext<ControlledFieldContextValue | null>(null);

export function useControlledField(): ControlledFieldContextValue {
  const ctx = useContext(ControlledFieldContext);
  if (!ctx) throw new Error('useControlledField must be used within ControlledField');
  return ctx;
}

type ControlledFieldProps<T extends FieldValues> = ComponentProps<typeof Field> & {
  name: Path<T>;
  control: Control<T>;
  disabled?: boolean;
};

export const ControlledField = <T extends FieldValues>({
  name,
  control,
  disabled,
  ...props
}: ControlledFieldProps<T>) => {
  const controller = useController({ name, control, disabled });
  return (
    <ControlledFieldContext.Provider value={controller as ControlledFieldContextValue}>
      <Field
        data-invalid={controller.fieldState.invalid}
        data-disabled={controller.field.disabled}
        {...props}
      />
    </ControlledFieldContext.Provider>
  );
};

type ControlledFieldProviderProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  disabled?: boolean;
  children: ReactNode;
};

export const ControlledFieldProvider = <T extends FieldValues>({
  name,
  control,
  disabled,
  children,
}: ControlledFieldProviderProps<T>) => {
  const controller = useController({ name, control, disabled });
  return (
    <ControlledFieldContext.Provider value={controller as ControlledFieldContextValue}>
      {children}
    </ControlledFieldContext.Provider>
  );
};

export function ControlledFieldLabel(props: ComponentProps<typeof FieldLabel>) {
  const { field } = useControlledField();
  return <FieldLabel htmlFor={field.name} {...props} />;
}

export function ControlledFieldError(props: ComponentProps<typeof FieldError>) {
  const { fieldState } = useControlledField();
  if (!fieldState.invalid) return null;

  return <FieldError errors={[fieldState.error]} {...props} />;
}
