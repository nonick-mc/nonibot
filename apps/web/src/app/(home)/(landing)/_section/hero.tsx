import { ArrowRightIcon, LayoutDashboardIcon } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className='container max-w-6xl py-32 text-center'>
      <div className='mx-auto flex max-w-5xl flex-col gap-6'>
        <h1 className='text-3xl font-bold lg:text-6xl'>
          あなたのDiscordサーバーを
          <br />
          もっと<span className='text-primary'>便利</span>に。
        </h1>
        <p className='text-muted-foreground text-balance lg:text-lg'>
          nonibotは、サーバー運営のサポートに特化した次世代のDiscordBotです。サーバー運営に関する便利な機能を幅広く搭載しています。
        </p>
      </div>
      <div className='flex justify-center gap-3 pt-7 pb-12'>
        <Button
          size='lg'
          render={
            <Link href={'/docs' as Route}>
              <ArrowRightIcon />
              はじめる
            </Link>
          }
          nativeButton={false}
        />
        <Button
          size='lg'
          variant='outline'
          render={
            <Link href='/dashboard' target='_blank'>
              <LayoutDashboardIcon />
              ダッシュボード
            </Link>
          }
          nativeButton={false}
        />
      </div>
      <div className='mask-b-from-80%'>
        {(['dark', 'light'] as const).map((theme) => (
          <Image
            key={theme}
            src={`https://cdn.nonick.net/nonibot/landing/app-screenshot-${theme}.png`}
            alt='ダッシュボードのスクリーンショット'
            width={1202}
            height={752}
            priority
            className={`h-auto w-full rounded-t-xl border ${theme === 'dark' ? 'hidden dark:block' : 'dark:hidden'}`}
          />
        ))}
      </div>
    </section>
  );
}
