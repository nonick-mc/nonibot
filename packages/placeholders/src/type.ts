export type PlaceholderType = 'text' | 'mention' | 'url';

export type Placeholder<K extends string = string> = readonly {
  key: K;
  description: string;
  type: PlaceholderType;
  deprecated?: boolean;
}[];

export type PlaceholderKey<T extends Placeholder> = T[number]['key'];
export type PlaceholderParams<T extends Placeholder> = Record<PlaceholderKey<T>, string>;
