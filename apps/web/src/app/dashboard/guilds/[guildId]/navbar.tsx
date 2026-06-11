import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { CurrentUserDropdownMenu } from '@/components/current-user-dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavbarBreadcrumb } from './navbar-breadcrumb';

export function Navbar() {
  return (
    <nav className='sticky top-0 z-10 px-6 flex items-center justify-between h-14 border-b bg-background'>
      <div className='flex items-center gap-2'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2' />
        <NavbarBreadcrumb />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<CurrentUserAvatar />} nativeButton={false} />
        <DropdownMenuContent align='end'>
          <CurrentUserDropdownMenu />
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
