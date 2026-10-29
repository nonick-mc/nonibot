'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { type DevDataMode, DevDataModes } from './worst-case';

const Labels: Record<DevDataMode, string> = {
  demo: 'Demo data',
  worst: 'Worst case',
  empty: 'Empty',
  one: 'One',
};

/** break-ui: 開発時専用の切り替え。呼び出し側で`NODE_ENV === 'development'`のときだけ描画する */
export function DevDataToggle({ mode }: { mode: DevDataMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (next: DevDataMode) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'demo') params.delete('data');
    else params.set('data', next);
    params.delete('page');
    router.replace(`${pathname}?${params}` as Route);
  };

  return (
    <div className='fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 gap-0.5 rounded-full bg-neutral-200 p-0.5 font-sans text-xs shadow'>
      {DevDataModes.map((m) => (
        <button
          key={m}
          type='button'
          onClick={() => select(m)}
          className={cn(
            'rounded-full px-3 py-1 text-neutral-600',
            m === mode && 'bg-white font-medium text-neutral-900',
          )}
        >
          {Labels[m]}
        </button>
      ))}
    </div>
  );
}
