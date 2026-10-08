import type { Placeholder } from '@repo/placeholders';
import { createContext } from 'react';

export type PlaceholderContextValue = {
  placeholders?: Placeholder;
};

export const PlaceholderContext = createContext<PlaceholderContextValue>({});
