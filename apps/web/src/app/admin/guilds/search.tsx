'use client';

import { SearchIcon } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const [debounced] = useDebounceValue(value.trim(), 300);

  useEffect(() => {
    if (debounced === (searchParams.get('q') ?? '')) return;

    const params = new URLSearchParams(searchParams);
    if (debounced) params.set('q', debounced);
    else params.delete('q');
    params.delete('page');
    router.replace(`${pathname}?${params}` as Route);
  }, [debounced, pathname, router, searchParams]);

  return (
    <InputGroup className='h-10 w-full bg-card sm:w-72'>
      <InputGroupInput
        inputMode='numeric'
        placeholder='サーバーIDで検索'
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}
