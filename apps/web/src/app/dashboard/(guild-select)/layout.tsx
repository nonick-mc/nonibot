import { type PropsWithChildren, Suspense } from 'react';
import { InviteButton } from './invite-button';
import { Navbar } from './navbar';
import { SearchInput } from './search-input';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      <div className='max-w-7xl w-full p-6 mx-auto flex flex-col gap-6'>
        <div className='flex max-sm:flex-col items-stretch justify-between gap-2'>
          <Suspense>
            <SearchInput />
          </Suspense>
          <InviteButton />
        </div>
        {children}
      </div>
    </>
  );
}
