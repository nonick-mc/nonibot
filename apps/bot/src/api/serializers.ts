import type {
  InternalApiChannel,
  InternalApiEmoji,
  InternalApiGuild,
  InternalApiMember,
  InternalApiRole,
} from '@repo/shared/types';
import {
  type Guild,
  type GuildBasedChannel,
  type GuildEmoji,
  type GuildMember,
  type Role,
  ThreadOnlyChannel,
} from 'discord.js';

export function serializeGuild(guild: Guild): InternalApiGuild {
  return {
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    owner_id: guild.ownerId,
    features: guild.features,
    bot_highest_role_position: guild.members.me?.roles.highest.rawPosition ?? 0,
    bot_permissions: guild.members.me?.permissions.bitfield.toString() ?? '0',
  };
}

export function serializeRole(role: Role): InternalApiRole {
  return {
    id: role.id,
    name: role.name,
    position: role.rawPosition,
    colors: {
      primary_color: role.colors.primaryColor,
      secondary_color: role.colors.secondaryColor,
      tertiary_color: role.colors.tertiaryColor,
    },
    managed: role.managed,
    permissions: role.permissions.bitfield.toString(),
  };
}

export function serializeChannel(
  channel: GuildBasedChannel,
  me: GuildMember | null,
): InternalApiChannel {
  const base = {
    id: channel.id,
    name: channel.name,
    position: 'rawPosition' in channel ? channel.rawPosition : 0,
    parent_id: 'parentId' in channel ? channel.parentId : null,
    bot_permissions: (me && channel.permissionsFor(me)?.bitfield.toString()) || '0',
  };

  if (channel instanceof ThreadOnlyChannel) {
    return {
      ...base,
      type: channel.type,
      available_tags: channel.availableTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        moderated: tag.moderated,
        emoji_id: tag.emoji?.id ?? null,
        emoji_name: tag.emoji?.name ?? null,
      })),
    };
  }

  return { ...base, type: channel.type };
}

export function serializeEmoji(emoji: GuildEmoji): InternalApiEmoji {
  return {
    id: emoji.id,
    name: emoji.name,
    animated: emoji.animated ?? false,
  };
}

export function serializeMember(member: GuildMember): InternalApiMember {
  return {
    permissions: member.permissions.bitfield.toString(),
    roles: [...member.roles.cache.keys()],
  };
}
