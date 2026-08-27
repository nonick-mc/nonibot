import { client } from '..';

type PrefixedMap<P extends string, T extends readonly string[]> = {
  readonly [K in T[number]]: `${P}_${Lowercase<K>}`;
};

type EmojiName =
  | (typeof Success)[keyof typeof Success]
  | (typeof Destructive)[keyof typeof Destructive]
  | (typeof Default)[keyof typeof Default];

function createEmojiMap<P extends string, T extends readonly string[]>(
  prefix: P,
  keys: T,
): PrefixedMap<P, T> {
  const result = {} as any;
  for (const key of keys) {
    result[key] = `${prefix}_${key.toLowerCase()}`;
  }
  return result;
}

// #22c55e
export const Success = createEmojiMap('success', ['circleCheck'] as const);

// #ef4444
export const Destructive = createEmojiMap('destructive', ['shieldAlert', 'circleAlert'] as const);

// #ffffff
export const Default = createEmojiMap('default', ['arrowLeft', 'arrowRight'] as const);

export function getAppEmoji(name: EmojiName) {
  return client.application?.emojis.cache.find((emoji) => emoji.name === name) ?? '❌️';
}

export function getAppEmojiId(name: EmojiName) {
  const emoji = getAppEmoji(name);
  return typeof emoji === 'string' ? emoji : emoji.id;
}
