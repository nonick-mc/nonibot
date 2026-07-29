import type { APIEmoji, APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';
import { createContext, useContext } from 'react';

export type DiscordMessageContextValue = {
  emojis: APIEmoji[];
  roles: APIRole[];
  channels: APIGuildChannel<GuildChannelType>[];
};

export const DiscordMessageContext = createContext<DiscordMessageContextValue | null>(null);

export function useDiscordMessageContext() {
  const ctx = useContext(DiscordMessageContext);
  if (!ctx)
    throw new Error('useDiscordMessageContext must be used within DiscordMessageContext.Provider');
  return ctx;
}
