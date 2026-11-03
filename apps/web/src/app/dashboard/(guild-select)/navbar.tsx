'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { CurrentUserDropdownMenu } from '@/components/current-user-dropdown-menu';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const isDashboardTop = usePathname() === '/dashboard';

  return (
    <header id='nd-nav' className='sticky top-0 z-40 h-14'>
      <div className='border-b bg-background/80 backdrop-blur-lg transition-colors'>
        <nav className='mx-auto flex h-14 w-full max-w-350 items-center px-6'>
          {isDashboardTop ? (
            <Logo height={18} />
          ) : (
            <Link href='/dashboard'>
              <Logo height={18} />
            </Link>
          )}
          <div className='flex flex-1 flex-row items-center justify-end gap-1.5'>
            <DropdownMenu>
              <DropdownMenuTrigger render={<CurrentUserAvatar />} nativeButton={false} />
              <DropdownMenuContent align='end'>
                <CurrentUserDropdownMenu />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  );
}
