import { ArrowRightIcon, LayoutDashboardIcon } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { Reveal } from '../reveal';

export function HeroSection() {
  return (
    <div className='relative'>
      {(['dark', 'light'] as const).map((theme) => (
        <FlickeringGrid
          key={theme}
          aria-hidden
          squareSize={4}
          gridGap={6}
          flickerChance={0.2}
          maxOpacity={0.1}
          color={theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'}
          className={`pointer-events-none absolute inset-0 -z-10 mask-b-from-20% mask-radial-from-40% ${theme === 'dark' ? 'hidden dark:block' : 'dark:hidden'}`}
        />
      ))}
      <section className='container max-w-6xl py-32 text-center'>
        <Reveal className='mx-auto flex max-w-5xl flex-col gap-6'>
          <h1 className='text-3xl font-bold lg:text-6xl'>
            あなたのDiscordサーバーを
            <br />
            もっと<span className='text-primary'>便利</span>に。
          </h1>
          <p className='text-muted-foreground text-balance lg:text-lg'>
            nonibotは、サーバー運営のサポートに特化した次世代のDiscordBotです。サーバー運営に関する便利な機能を幅広く搭載しています。
          </p>
        </Reveal>
        <Reveal delay={0.15} className='flex justify-center gap-3 pt-7 pb-12'>
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
            variant='secondary'
            render={
              <Link href='/dashboard'>
                <LayoutDashboardIcon />
                ダッシュボード
              </Link>
            }
            nativeButton={false}
          />
        </Reveal>
        <Reveal delay={0.3} className='mask-b-from-80%'>
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
        </Reveal>
      </section>
    </div>
  );
}
