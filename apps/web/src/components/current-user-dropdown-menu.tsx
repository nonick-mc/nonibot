'use client';

import {
  ArrowRightFromSquare,
  BookOpen,
  CircleQuestion,
  House,
  Palette,
  Sliders,
} from '@gravity-ui/icons';
import { Links } from '@repo/shared/constants';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { GravityIcon } from '@/components/gravity-icon';
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
                <GravityIcon icon={Sliders} />
                ダッシュボード
              </Link>
            }
            nativeButton={false}
          />
        )}
        <DropdownMenuItem
          render={
            <Link href={'/docs' as Route} target={inDashboard ? '_blank' : '_self'}>
              <GravityIcon icon={BookOpen} />
              ドキュメント
            </Link>
          }
          nativeButton={false}
        />
        <DropdownMenuItem
          render={
            <Link href='/' target={inDashboard ? '_blank' : '_self'}>
              <GravityIcon icon={House} />
              ホームページ
            </Link>
          }
          nativeButton={false}
        />
        <DropdownMenuItem
          render={
            <Link href={Links.SupportServer} target='_blank'>
              <GravityIcon icon={CircleQuestion} />
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
            <GravityIcon icon={Palette} />
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
                  if (pathname === '/') {
                    router.refresh();
                  } else {
                    router.push('/');
                  }
                },
              },
            });
          }}
          variant='destructive'
        >
          <GravityIcon icon={ArrowRightFromSquare} />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}
