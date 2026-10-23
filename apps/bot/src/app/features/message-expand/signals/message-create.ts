import { Events, PermissionFlagsBits } from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import {
  buildComponents,
  buildPages,
  canViewChannel,
  fetchSource,
  isNsfwChannel,
  type SourceIds,
} from '../expand';

export const signal = new Signal(Events.MessageCreate);

const MaxExpands = 3;
const urlRegex =
  /(?<startPattern>.)?https?:\/\/(?:.+\.)?discord(?:.+)?.com\/channels\/(?<guildId>\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)(?<endPattern>.)?/g;

execute(signal, async (message) => {
  if (!message.inGuild() || message.author.bot || message.system) return;
  if (
    !message.channel
      .permissionsFor(message.client.user)
      ?.has([
        PermissionFlagsBits.ViewChannel,
        message.channel.isThread()
          ? PermissionFlagsBits.SendMessagesInThreads
          : PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory,
      ])
  )
    return;

  const setting = await db.query.msgExpandSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, message.guildId),
  });
  if (!setting?.enabled) return;
  if (
    setting.ignoreChannelTypes.includes(message.channel.type) ||
    setting.ignoreChannels.includes(message.channelId)
  )
    return;

  const targets = new Map<string, SourceIds>();
  for (const match of message.content.matchAll(urlRegex)) {
    const { startPattern, endPattern, guildId, channelId, messageId } = match.groups ?? {};
    if (!(guildId && channelId && messageId)) continue;
    if (startPattern && setting.ignorePrefixes.includes(startPattern)) continue;
    if (startPattern === '<' && endPattern === '>') continue;
    targets.set(`${channelId}:${messageId}`, { guildId, channelId, messageId });
  }

  for (const { guildId, channelId, messageId } of [...targets.values()].slice(0, MaxExpands)) {
    if (guildId !== message.guildId) {
      if (setting.onlyOwnGuild) continue;
      const external = await db.query.msgExpandSetting.findFirst({
        where: (s, { eq }) => eq(s.guildId, guildId),
      });
      if (!external?.allowExternalGuild) continue;
    }

    try {
      const source = await fetchSource(message.client, { guildId, channelId, messageId });
      if (!source) continue;
      if (!(await canViewChannel(source.guild, source.channel, message.author.id))) continue;
      if (isNsfwChannel(source.channel) && !isNsfwChannel(message.channel)) continue;

      const pages = buildPages(source.message);
      const [first] = pages;
      if (!first) continue;
      await message.reply({
        embeds: [first],
        components: buildComponents(0, pages.length, { guildId, channelId, messageId }),
        allowedMentions: { parse: [] },
      });
    } catch (e) {
      console.error(e);
    }
  }
});
