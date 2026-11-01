import { createContext } from 'react';
import type { MessageResources } from '../resources';

export const PreviewResourcesContext = createContext<
  Pick<MessageResources, 'roles' | 'channels' | 'placeholders'>
>({});
