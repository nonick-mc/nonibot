import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { CurrentUserDropdownMenu } from '@/components/current-user-dropdown-menu';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  return (
    <header id='nd-nav' className='sticky top-0 z-40 h-14'>
      <div className='border-b bg-background/80 backdrop-blur-lg transition-colors'>
        <nav className='mx-auto flex h-14 w-full max-w-350 items-center px-6'>
          <Logo height={17} />
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
