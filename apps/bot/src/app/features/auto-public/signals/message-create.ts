import { ChannelType, Events, type Message, MessageType, PermissionFlagsBits } from 'discord.js';
import { execute, Signal } from 'sunar';
import { Destructive, getAppEmoji } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';

export const signal = new Signal(Events.MessageCreate);

execute(signal, async (message) => {
  if (!message.inGuild()) return;
  if (message.channel.type !== ChannelType.GuildAnnouncement) return;

  const setting = await db.query.autoPublicSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, message.guildId),
  });
  if (!setting?.enabled) return;
  if (!setting.channels.includes(message.channelId)) return;

  if (message.webhookId && setting.ignoreWebhooks) return;
  if (setting.ignoreRoles.length && message.member?.roles.cache.hasAny(...setting.ignoreRoles))
    return;

  // メッセージの形式が通常かつcrosspostableがfalseの場合でもリアクションを付ける
  if (!message.crosspostable) {
    if (setting.reactOnFailure && message.type === MessageType.Default) {
      await reactFailure(message);
    }
    return;
  }

  try {
    await message.crosspost();
  } catch (e) {
    console.error(e);
    if (setting.reactOnFailure) await reactFailure(message);
  }
});

async function reactFailure(message: Message<true>) {
  const canUseExternalEmojis = message.channel
    .permissionsFor(message.client.user)
    ?.has(PermissionFlagsBits.UseExternalEmojis);
  const emoji = canUseExternalEmojis ? getAppEmoji(Destructive.circleAlert) : '❌';
  await message.react(emoji).catch((e) => console.error(e));
}
