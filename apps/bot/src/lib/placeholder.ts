import type {
  joinMessagePlaceholders,
  leaveMessagePlaceholders,
  PlaceholderParams,
} from '@repo/placeholders';
import type { GuildMember, PartialGuildMember } from 'discord.js';

export function getJoinMessagePlaceholderParams(
  member: GuildMember | PartialGuildMember,
): PlaceholderParams<typeof joinMessagePlaceholders> {
  return {
    serverName: member.guild.name,
    memberCount: member.guild.memberCount.toString(),
    user: `${member}`,
    userName: member.user.username,
    userTag: member.user.tag,
    userAvatar: member.user.displayAvatarURL(),
  };
}

export function getLeaveMessagePlaceholderParams(
  member: GuildMember | PartialGuildMember,
): PlaceholderParams<typeof leaveMessagePlaceholders> {
  return {
    serverName: member.guild.name,
    memberCount: member.guild.memberCount.toString(),
    user: `${member}`,
    userName: member.user.username,
    userTag: member.user.tag,
    userAvatar: member.user.displayAvatarURL(),
  };
}
