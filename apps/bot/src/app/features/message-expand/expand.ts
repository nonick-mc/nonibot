import {
  ActionRowBuilder,
  type Attachment,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  Colors,
  EmbedBuilder,
  escapeMarkdown,
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

// embedのdescriptionの文字数上限
const DescriptionMaxLength = 4096;

export function buildPages(msg: Message) {
  const author = {
    name: msg.member?.displayName ?? msg.author.tag,
    iconURL: msg.member?.displayAvatarURL() ?? msg.author.displayAvatarURL(),
  };
  const info = new EmbedBuilder()
    .setTitle('メッセージ展開')
    .setURL(msg.url)
    .setColor(Colors.White)
    .setAuthor(author)
    .addFields({ name: '送信時刻', value: time(msg.createdAt), inline: true });
  const createPage = () => new EmbedBuilder(info.toJSON());

  const contentPages = (
    msg.content.match(new RegExp(`.{1,${DescriptionMaxLength}}`, 'gs')) ?? []
  ).map((content) => createPage().setDescription(content));

  // 画像はそのまま表示し、それ以外の添付ファイルはリンクとして1ページにまとめる
  const isImage = (attachment: Attachment) => attachment.contentType?.startsWith('image/');
  const imagePages = msg.attachments
    .filter(isImage)
    .map((attachment) => createPage().setImage(attachment.url));
  const files = msg.attachments.filter((attachment) => !isImage(attachment));
  const filePages = files.size
    ? [
        createPage().setDescription(
          files
            .map((file) => `[${escapeMarkdown(file.name)}](${file.url})`)
            .join('\n')
            .slice(0, DescriptionMaxLength),
        ),
      ]
    : [];

  // 元のembedにも送信者が分かるように、authorが未設定の場合は補う
  const embedPages = msg.embeds.map((embed) => {
    const page = EmbedBuilder.from(embed);
    return page.data.author ? page : page.setAuthor(author);
  });

  const pages = [...contentPages, ...imagePages, ...filePages, ...embedPages];
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
