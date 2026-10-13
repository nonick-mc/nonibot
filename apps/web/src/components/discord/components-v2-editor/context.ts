import { createContext, useContext } from 'react';
import type { MessageResources } from '../resources';

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

export const EditorResourcesContext = createContext<MessageResources>({});

export function useEditorResources() {
  return useContext(EditorResourcesContext);
}
