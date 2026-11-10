'use client';

import type { InternalApiGuild } from '@repo/shared/types';
import { createContext, type ReactNode, useContext } from 'react';

export type CurrentGuild = Pick<InternalApiGuild, 'id' | 'name' | 'icon'>;

const CurrentGuildContext = createContext<CurrentGuild | null>(null);

export function CurrentGuildProvider({
  guild,
  children,
}: {
  guild: CurrentGuild | null;
  children: ReactNode;
}) {
  return <CurrentGuildContext value={guild}>{children}</CurrentGuildContext>;
}

export function useCurrentGuild() {
  return useContext(CurrentGuildContext);
}
