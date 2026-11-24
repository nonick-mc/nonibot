'use client';

import { Magnifier, Xmark } from '@gravity-ui/icons';
import { useQueryState } from 'nuqs';
import { GravityIcon } from '@/components/gravity-icon';
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
        <GravityIcon icon={Magnifier} />
      </InputGroupAddon>
      {query && (
        <InputGroupAddon align='inline-end'>
          <InputGroupButton onClick={() => setQuery(null)} size='icon-xs'>
            <GravityIcon icon={Xmark} />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
