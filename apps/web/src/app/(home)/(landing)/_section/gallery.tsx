import { ArrowRightIcon, ArrowUpRightIcon } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '../reveal';

const items = [
  {
    id: 'welcome-message',
    title: '入退室メッセージ',
    summary:
      'ユーザーがサーバーに参加・脱退した際にメッセージを送信して、メンバーを歓迎することができます。',
  },
  {
    id: 'report',
    title: 'サーバー内通報',
    summary:
      'サーバーのルールに違反したメッセージを、サーバーの利用者が通報機能を使用して運営に報告することができます。',
  },
  {
    id: 'log',
    title: 'イベントログ',
    summary:
      'タイムアウトやBAN、メッセージの削除や編集など、サーバーの様々なイベントの記録を送信することができます。',
  },
  {
    id: 'verification',
    title: 'メンバー認証',
    summary: '特定のロールをボタン押下や画像認証、Web認証を通して付与させることができます。',
  },
] as const;

// ponytail: v5のカルーセルはやめてグリッド表示。横スクロールが必要になったらembla等を追加
export function GallerySection() {
  return (
    <section className='container max-w-6xl py-32'>
      <Reveal>
        <h2 className='mb-3 text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6'>
          搭載している機能
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <Link
          href={'/docs' as Route}
          className='group mb-8 flex items-center gap-1 text-sm font-medium md:mb-14 md:text-base lg:mb-16 lg:text-lg'
        >
          全ての機能を確認する
          <ArrowUpRightIcon className='size-4 transition-transform group-hover:translate-x-1' />
        </Link>
      </Reveal>
      <div className='grid gap-8 md:grid-cols-2'>
        {items.map((item, i) => (
          <Reveal key={item.id} delay={(i % 2) * 0.1}>
            <Link href={`/docs/features/${item.id}`} className='group flex flex-col gap-3'>
              <div className='aspect-3/2 overflow-clip rounded-xl'>
                <Image
                  src={`https://cdn.nonick.net/nonibot/landing/${item.id}.png`}
                  alt={item.title}
                  width={1080}
                  height={720}
                  className='size-full object-cover transition duration-300 group-hover:scale-105'
                />
              </div>
              <div className='pt-1 text-lg font-bold md:text-xl'>{item.title}</div>
              <div className='text-muted-foreground line-clamp-2 text-sm md:text-base'>
                {item.summary}
              </div>
              <div className='flex items-center text-sm'>
                詳細を見る
                <ArrowRightIcon className='ml-2 size-5 transition-transform group-hover:translate-x-1' />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
