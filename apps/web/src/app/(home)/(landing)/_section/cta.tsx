import { ArrowRightIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Reveal } from '../reveal';

export function CtaSection() {
  return (
    <section className='container max-w-6xl py-32'>
      <Reveal>
        <Card className='flex w-full flex-col gap-16 overflow-hidden rounded-lg p-8 md:rounded-xl lg:flex-row lg:items-center lg:p-12'>
          <div className='flex-1'>
            <h3 className='mb-3 text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6'>
              nonibotを導入しよう
            </h3>
            <p className='text-muted-foreground max-w-xl lg:text-lg'>
              nonibotを使用して、あなたのDiscordサーバーをさらに便利にしましょう。無料で使用することができ、導入も簡単です。
            </p>
          </div>
          <Button
            size='lg'
            className='shrink-0'
            render={
              <Link href={'/docs' as Route}>
                <ArrowRightIcon />
                はじめる
              </Link>
            }
            nativeButton={false}
          />
        </Card>
      </Reveal>
    </section>
  );
}
