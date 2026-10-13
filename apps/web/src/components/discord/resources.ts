import type { Placeholder } from '@repo/placeholders';
import type { ComponentAction } from '@repo/shared';
import type { APIEmoji, APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';

export type MessageResources = {
  emojis?: APIEmoji[];
  roles?: APIRole[];
  channels?: APIGuildChannel<GuildChannelType>[];
  componentActions?: ComponentAction[];
  placeholders?: Placeholder;
};
