import {
  type APIGuildCategoryChannel,
  type APIGuildChannel,
  type APIRole,
  type APISortableChannel,
  ChannelType,
  type GuildChannelType,
} from 'discord-api-types/v10';

/** 特定の権限が含まれていれば`true`を返す */
export function hasPermission(permissions: string, permission: bigint) {
  return (BigInt(permissions) & permission) === permission;
}

const byPosition = (a: APISortableChannel, b: APISortableChannel) => a.position - b.position;

function isVoiceChannel(type: GuildChannelType) {
  return type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice;
}

function sortGroup(channels: (APIGuildChannel & APISortableChannel)[]) {
  const text = channels.filter((ch) => !isVoiceChannel(ch.type)).sort(byPosition);
  const voice = channels.filter((ch) => isVoiceChannel(ch.type)).sort(byPosition);
  return [...text, ...voice];
}

/** チャンネルをDiscord上の配置順に並べ替え */
export function sortChannels(channels: APIGuildChannel<GuildChannelType>[]) {
  const sortable = channels as (APIGuildChannel & APISortableChannel)[];
  const categories = sortable
    .filter((ch) => ch.type === ChannelType.GuildCategory)
    .sort(byPosition);
  const others = sortable.filter((ch) => ch.type !== ChannelType.GuildCategory);

  const result: (APIGuildChannel & APISortableChannel)[] = sortGroup(
    others.filter((ch) => !ch.parent_id),
  );

  for (const category of categories) {
    result.push(category, ...sortGroup(others.filter((ch) => ch.parent_id === category.id)));
  }

  return result;
}

/** ロールを`position`順に並べ替え */
export function sortRoles(roles: APIRole[]) {
  return roles.sort((a, b) => b.position - a.position);
}

/** チャンネルをカテゴリごとに仕分け */
export function groupChannelsByCategory(
  channels: APIGuildChannel<GuildChannelType>[],
  includeCategories = false,
) {
  const categories = channels
    .filter((ch): ch is APIGuildCategoryChannel => ch.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  const selectableChannels = includeCategories
    ? channels
    : channels.filter((ch) => ch.type !== ChannelType.GuildCategory);

  const groupedChannels = new Map<string, APIGuildChannel<GuildChannelType>[]>();
  const uncategorized: APIGuildChannel<GuildChannelType>[] = [];

  for (const ch of selectableChannels) {
    if (ch.parent_id) {
      const group = groupedChannels.get(ch.parent_id) ?? [];
      group.push(ch);
      groupedChannels.set(ch.parent_id, group);
    } else {
      uncategorized.push(ch);
    }
  }

  return { categories, groupedChannels, uncategorized };
}

type AnyComponent = { type: number; components?: AnyComponent[]; accessory?: { type: number } };

/** コンポーネントのネストを含めた合計数を返す */
export function countTotalComponents(components: AnyComponent[]): number {
  return components.reduce((total, component) => {
    let count = 1;
    if (component.components) count += countTotalComponents(component.components);
    if (component.accessory) count += 1;
    return total + count;
  }, 0);
}

/** 配列からチャンネルまたはロールに存在するIDのみを返す */
export function filterValidIds(
  ids: string[] | undefined,
  channelOrRoles: APIGuildChannel<GuildChannelType>[] | APIRole[],
) {
  return ids?.filter((id) => channelOrRoles.some((item) => item.id === id)) ?? [];
}
