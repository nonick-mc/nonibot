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
    <nav className='sticky top-0 z-10 px-6 flex items-center justify-between h-16 bg-background border-b'>
      <Logo height={17} />
      <DropdownMenu>
        <DropdownMenuTrigger render={<CurrentUserAvatar />} nativeButton={false} />
        <DropdownMenuContent align='end'>
          <CurrentUserDropdownMenu />
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
