import { createContext, useContext } from 'react';

type ComponentEditorContextValue = {
  basePath: string;
  onRemove: () => void;
};

export const ComponentEditorContext = createContext<ComponentEditorContextValue | null>(null);

export function useComponentEditorContext() {
  const ctx = useContext(ComponentEditorContext);
  if (!ctx)
    throw new Error(
      'useComponentEditorContext must be used within ComponentEditorContext.Provider',
    );
  return ctx;
}
