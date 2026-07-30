export type Placeholder<K extends string = string> = readonly { key: K; description: string }[];

export type PlaceholderKey<T extends Placeholder> = T[number]['key'];
export type PlaceholderParams<T extends Placeholder> = Record<PlaceholderKey<T>, string>;
