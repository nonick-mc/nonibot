import { unorderedList } from 'discord.js';
import { Destructive, getAppEmoji, Success } from '../constants/emoji';

export function unorderedListTable(data: { label: string; value: string }[]) {
  return unorderedList(data.map((v) => `${v.label}: ${v.value}`));
}

export function errorMessage(content: string) {
  return `${getAppEmoji(Destructive.circleAlert)} ${content}`;
}

export function successMessage(content: string) {
  return `${getAppEmoji(Success.circleCheck)} ${content}`;
}
