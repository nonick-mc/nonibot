'use client';

import {
  BookOpenIcon,
  HouseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageCircleQuestionIcon,
  PaletteIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { Links } from '@/lib/constants';
import { CurrentUserAvatar } from './current-user-avatar';

export function CurrentUserDropdownMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const inDashboard = pathname.startsWith('/dashboard');

  if (!session) {
    return null;
  }

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel
          render={
            <div className='flex gap-3 items-center'>
              <CurrentUserAvatar />
              <section className='leading-tight text-sm'>
                <p className='text-foreground'>{session.user.globalName ?? session.user.name}</p>
                <p className='text-muted-foreground'>@{session.user.name}</p>
              </section>
            </div>
          }
        />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {!inDashboard && (
          <DropdownMenuItem
            render={
              <Link href='/dashboard'>
                <LayoutDashboardIcon strokeWidth={2} className='mt-0.5' />
                ダッシュボード
              </Link>
            }
            nativeButton={false}
          />
        )}
        <DropdownMenuItem
          render={
            <Link href='/docs' target={inDashboard ? '_blank' : '_self'}>
              <BookOpenIcon strokeWidth={2} className='mt-0.5' />
              ドキュメント
            </Link>
          }
          nativeButton={false}
        />
        <DropdownMenuItem
          render={
            <Link href='/' target={inDashboard ? '_blank' : '_self'}>
              <HouseIcon strokeWidth={2} className='mt-0.5' />
              ホームページ
            </Link>
          }
          nativeButton={false}
        />
        <DropdownMenuItem
          render={
            <Link href={Links.SupportServer} target='_blank'>
              <MessageCircleQuestionIcon strokeWidth={2} className='mt-0.5' />
              サポートサーバー
            </Link>
          }
          nativeButton={false}
        />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PaletteIcon strokeWidth={2} className='mt-0.5' />
            テーマ
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v)}>
              <DropdownMenuRadioItem value='system'>システム</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='light'>ライト</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='dark'>ダーク</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push('/');
                },
              },
            });
          }}
          variant='destructive'
        >
          <LogOutIcon strokeWidth={2} className='mt-0.5' />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}
