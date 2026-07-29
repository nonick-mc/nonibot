import type { APIEmoji, APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';
import { createContext, useContext } from 'react';

export type GuildContextValue = {
  emojis: APIEmoji[];
  roles: APIRole[];
  channels: APIGuildChannel<GuildChannelType>[];
};

export const GuildContext = createContext<GuildContextValue | null>(null);

export function useGuildContext() {
  const ctx = useContext(GuildContext);
  if (!ctx) throw new Error('useGuildContext must be used within GuildContext.Provider');
  return ctx;
}
