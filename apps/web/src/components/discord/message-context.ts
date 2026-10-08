import type { ComponentAction } from '@repo/shared';
import type { APIEmoji, APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';
import { createContext } from 'react';

export type DiscordMessageContextValue = {
  emojis?: APIEmoji[];
  roles?: APIRole[];
  channels?: APIGuildChannel<GuildChannelType>[];
  componentActions?: ComponentAction[];
};

export const DiscordMessageContext = createContext<DiscordMessageContextValue>({});
