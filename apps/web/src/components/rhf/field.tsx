'use client';

import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import {
  type Control,
  type FieldValues,
  type Path,
  type UseControllerReturn,
  useController,
  useFormState,
} from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '../ui/field';

type ControlledFieldContextValue = UseControllerReturn<FieldValues> & {
  isSubmitting: boolean;
};

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
  const controller = useController({ name, control });
  const { isSubmitting } = useFormState({ control });
  return (
    <ControlledFieldContext.Provider
      value={
        {
          ...controller,
          field: { ...controller.field, disabled },
          isSubmitting,
        } as ControlledFieldContextValue
      }
    >
      <Field data-invalid={controller.fieldState.invalid} data-disabled={disabled} {...props} />
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
  const controller = useController({ name, control });
  const { isSubmitting } = useFormState({ control });
  return (
    <ControlledFieldContext.Provider
      value={
        {
          ...controller,
          field: { ...controller.field, disabled },
          isSubmitting,
        } as ControlledFieldContextValue
      }
    >
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

  const error = fieldState.error?.root ?? fieldState.error;

  return <FieldError errors={[error]} {...props} />;
}
