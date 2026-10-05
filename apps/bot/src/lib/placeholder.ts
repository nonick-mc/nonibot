import type {
  autoThreadPlaceholders,
  joinMessagePlaceholders,
  leaveMessagePlaceholders,
  PlaceholderParams,
} from '@repo/placeholders';
import type { GuildMember, Message, PartialGuildMember } from 'discord.js';
import { pad } from './utils';

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

export function getAutoThreadPlaceholderParams(
  message: Message<true>,
): PlaceholderParams<typeof autoThreadPlaceholders> {
  const { author, member, createdAt } = message;
  const date = `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())}`;
  const time = `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}`;

  return {
    user: `${author}`,
    userName: author.username,
    userGlobalName: author.globalName ?? author.username,
    userDisplayName: member?.displayName ?? author.globalName ?? author.username,
    createdAt: `${date} ${time}`,
    createdAtDate: date,
    createdAtTime: time,
    userAvatar: author.displayAvatarURL(),
  };
}
