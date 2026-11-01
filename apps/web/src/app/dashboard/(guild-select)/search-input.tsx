'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export function SearchInput() {
  const [query, setQuery] = useQueryState('q');

  return (
    <InputGroup className='h-10 bg-card'>
      <InputGroupInput
        placeholder='サーバーを検索'
        value={query || ''}
        onChange={(e) => setQuery(e.target.value || null)}
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      {query && (
        <InputGroupAddon align='inline-end'>
          <InputGroupButton onClick={() => setQuery(null)} size='icon-sm'>
            <XIcon className='mt-0.5' />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
