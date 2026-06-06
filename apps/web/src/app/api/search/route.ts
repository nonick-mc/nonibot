import { createFromSource } from 'fumadocs-core/search/server';
import { tokenize } from 'wakachigaki';
import { source } from '@/lib/source';

export const { GET } = createFromSource(source, {
  tokenizer: {
    language: 'english',
    stemming: false,
    normalizationCache: new Map(),
    tokenize: (raw) => {
      return tokenize(raw);
    },
  },
});
