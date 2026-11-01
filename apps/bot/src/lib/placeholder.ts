import type {
  autoCreateThreadMessagePlaceholders,
  autoCreateThreadNamePlaceholders,
  customActionBasePlaceholders,
  joinMessagePlaceholders,
  leaveMessagePlaceholders,
  PlaceholderParams,
} from '@repo/placeholders';
import type { ButtonInteraction, GuildMember, Message, PartialGuildMember } from 'discord.js';
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

export function getAutoCreateThreadNamePlaceholderParams(
  message: Message<true>,
): PlaceholderParams<typeof autoCreateThreadNamePlaceholders> {
  const { author, member, createdAt } = message;
  const date = `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())}`;
  const time = `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}`;

  return {
    userName: author.username,
    userGlobalName: author.globalName ?? author.username,
    userDisplayName: member?.displayName ?? author.globalName ?? author.username,
    createdAt: `${date} ${time}`,
    createdAtDate: date,
    createdAtTime: time,
  };
}

export function getAutoCreateThreadMessagePlaceholderParams(
  message: Message<true>,
): PlaceholderParams<typeof autoCreateThreadMessagePlaceholders> {
  return {
    ...getAutoCreateThreadNamePlaceholderParams(message),
    user: `${message.author}`,
    userAvatar: message.author.displayAvatarURL(),
  };
}

export function getCustomActionPlaceholderParams(
  interaction: ButtonInteraction<'cached'>,
): PlaceholderParams<typeof customActionBasePlaceholders> {
  const { member, guild } = interaction;
  return {
    serverName: guild.name,
    memberCount: guild.memberCount.toString(),
    user: `${member}`,
    userName: member.user.username,
    userAvatar: member.user.displayAvatarURL(),
  };
}
