import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  Colors,
  EmbedBuilder,
  type Guild,
  type GuildBasedChannel,
  type Message,
  time,
} from 'discord.js';

export const MessageExpandCustomIdPrefix = 'message-expand:';

export type SourceIds = { guildId: string; channelId: string; messageId: string };

// 展開元のチャンネルとメッセージを取得する。取得できない場合は null
export async function fetchSource(client: Client, { guildId, channelId, messageId }: SourceIds) {
  const guild = client.guilds.cache.get(guildId);
  const channel = await guild?.channels.fetch(channelId).catch(() => null);
  if (!(guild && channel?.isTextBased())) return null;
  const message = await channel.messages.fetch(messageId).catch(() => null);
  return message ? { guild, channel, message } : null;
}

export function isNsfwChannel(channel: GuildBasedChannel) {
  const target = channel.isThread() ? channel.parent : channel;
  return !!target && 'nsfw' in target && target.nsfw;
}

// 展開元のチャンネルを特定のユーザーが閲覧できるかどうか
export async function canViewChannel(guild: Guild, channel: GuildBasedChannel, userId: string) {
  const member = await guild.members.fetch(userId).catch(() => null);
  return !!member && channel.permissionsFor(member).has(['ViewChannel', 'ReadMessageHistory']);
}

export function buildPages(msg: Message) {
  const info = new EmbedBuilder()
    .setTitle('メッセージ展開')
    .setURL(msg.url)
    .setColor(Colors.White)
    .setAuthor({
      name: msg.member?.displayName ?? msg.author.tag,
      iconURL: msg.member?.displayAvatarURL() ?? msg.author.displayAvatarURL(),
    })
    .addFields({ name: '送信時刻', value: time(msg.createdAt), inline: true });

  const contentPages = (msg.content.match(/.{1,1024}/gs) ?? []).map((content) =>
    new EmbedBuilder(info.toJSON()).setDescription(content),
  );
  const attachmentPages = msg.attachments.map((attachment) =>
    new EmbedBuilder(info.toJSON()).setImage(attachment.url),
  );
  const pages = [
    ...contentPages,
    ...attachmentPages,
    ...msg.embeds.map((embed) => EmbedBuilder.from(embed)),
  ];
  // Discordの1メッセージあたりのembed数制限は10だが、ページは1つずつ表示する
  return pages.length ? pages : [info];
}

export function buildComponents(page: number, total: number, ids: SourceIds) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  const source = `${ids.guildId}:${ids.channelId}:${ids.messageId}`;
  if (total > 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${MessageExpandCustomIdPrefix}prev:${page}:${source}`)
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 0),
      new ButtonBuilder()
        .setCustomId(`${MessageExpandCustomIdPrefix}page`)
        .setLabel(`${page + 1} / ${total}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`${MessageExpandCustomIdPrefix}next:${page}:${source}`)
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= total - 1),
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`${MessageExpandCustomIdPrefix}delete`)
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
  );
  return [row];
}
