import type { PropsWithChildren } from 'react';
import { Navbar } from '@/app/dashboard/(guild-select)/navbar';
import { verifyAdminPermission } from '@/lib/dal';

export default async function Layout({ children }: PropsWithChildren) {
  await verifyAdminPermission();

  return (
    <>
      <Navbar />
      <main className='container max-w-350 flex w-full flex-col gap-6 py-6'>{children}</main>
    </>
  );
}
