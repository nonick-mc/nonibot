import type { InternalApiChannel, InternalApiRole } from '@repo/shared/types';
import { ChannelType, type GuildChannelType } from 'discord-api-types/v10';

/** 特定の権限が含まれていれば`true`を返す */
export function hasPermission(permissions: string, permission: bigint) {
  return (BigInt(permissions) & permission) === permission;
}

const byPosition = (a: InternalApiChannel, b: InternalApiChannel) => a.position - b.position;

function isVoiceChannel(type: GuildChannelType) {
  return type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice;
}

function sortGroup(channels: InternalApiChannel[]) {
  const text = channels.filter((ch) => !isVoiceChannel(ch.type)).sort(byPosition);
  const voice = channels.filter((ch) => isVoiceChannel(ch.type)).sort(byPosition);
  return [...text, ...voice];
}

/** チャンネルをDiscord上の配置順に並べ替え */
export function sortChannels(channels: InternalApiChannel[]) {
  const categories = channels
    .filter((ch) => ch.type === ChannelType.GuildCategory)
    .sort(byPosition);
  const others = channels.filter((ch) => ch.type !== ChannelType.GuildCategory);

  const result: InternalApiChannel[] = sortGroup(others.filter((ch) => !ch.parent_id));

  for (const category of categories) {
    result.push(category, ...sortGroup(others.filter((ch) => ch.parent_id === category.id)));
  }

  return result;
}

/** ロールを`position`順に並べ替え */
export function sortRoles(roles: InternalApiRole[]) {
  return roles.sort((a, b) => b.position - a.position);
}

/** チャンネルをカテゴリごとに仕分け */
export function groupChannelsByCategory(channels: InternalApiChannel[], includeCategories = false) {
  const categories = channels
    .filter((ch) => ch.type === ChannelType.GuildCategory)
    .sort(byPosition);

  const selectableChannels = includeCategories
    ? channels
    : channels.filter((ch) => ch.type !== ChannelType.GuildCategory);

  const groupedChannels = new Map<string, InternalApiChannel[]>();
  const uncategorized: InternalApiChannel[] = [];

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
  channelOrRoles: InternalApiChannel[] | InternalApiRole[],
) {
  return ids?.filter((id) => channelOrRoles.some((item) => item.id === id)) ?? [];
}
