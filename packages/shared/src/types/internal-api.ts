import type { ChannelType, GuildChannelType, GuildFeature } from 'discord-api-types/v10';

export type InternalApiGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  features: `${GuildFeature}`[];
  bot_highest_role_position: number;
  bot_permissions: string;
};

export type InternalApiRoleColors = {
  primary_color: number;
  secondary_color: number | null;
  tertiary_color: number | null;
};

export type InternalApiRole = {
  id: string;
  name: string;
  position: number;
  colors: InternalApiRoleColors;
  managed: boolean;
  permissions: string;
};

export type InternalApiForumTag = {
  id: string;
  name: string;
  moderated: boolean;
  emoji_id: string | null;
  emoji_name: string | null;
};

type InternalApiBaseChannel = {
  id: string;
  name: string;
  position: number;
  parent_id: string | null;
  bot_permissions: string;
};

//#region Channel
type InternalApiForumChannelType = ChannelType.GuildForum | ChannelType.GuildMedia;

export type InternalApiForumChannel = InternalApiBaseChannel & {
  type: InternalApiForumChannelType;
  available_tags: InternalApiForumTag[];
};

export type InternalApiChannel =
  | (InternalApiBaseChannel & { type: Exclude<GuildChannelType, InternalApiForumChannelType> })
  | InternalApiForumChannel;
//#endregion

export type InternalApiEmoji = {
  id: string;
  name: string | null;
  animated: boolean;
};

export type InternalApiMember = {
  permissions: string;
  roles: string[];
};

export type InternalApiUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar_url: string;
};

export type InternalApiError = {
  error: string;
};
