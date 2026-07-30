import type { Placeholder } from '@repo/placeholders';
import type { APIEmoji, APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';
import { createContext } from 'react';

export type DiscordMessageContextValue = {
  emojis?: APIEmoji[];
  roles?: APIRole[];
  channels?: APIGuildChannel<GuildChannelType>[];
  placeholders?: Placeholder;
};

export const DiscordMessageContext = createContext<DiscordMessageContextValue>({});
