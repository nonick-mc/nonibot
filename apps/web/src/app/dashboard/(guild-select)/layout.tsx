import { type PropsWithChildren, Suspense } from 'react';
import { InviteButton } from './invite-button';
import { Navbar } from './navbar';
import { SearchInput } from './search-input';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      <main className='container max-w-6xl flex w-full flex-col gap-6 py-6'>
        <div className='flex items-stretch justify-between gap-2 max-sm:flex-col'>
          <Suspense>
            <SearchInput />
          </Suspense>
          <InviteButton />
        </div>
        {children}
      </main>
    </>
  );
}
