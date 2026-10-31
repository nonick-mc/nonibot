import { Links } from '@repo/shared/constants';
import type { Route } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const menuItems = [
  {
    title: 'Resources',
    links: [
      { text: 'ダッシュボード', url: '/dashboard' },
      { text: 'ドキュメント', url: '/docs' },
      { text: 'サポートサーバー', url: Links.SupportServer },
      { text: 'ロードマップ', url: Links.Roadmap },
    ],
  },
  {
    title: 'Social',
    links: [
      { text: 'GitHub', url: 'https://github.com/nonick-mc/nonick.js' },
      { text: 'Twitter', url: 'https://x.com/nonick_mc' },
    ],
  },
];

const bottomLinks = [
  { text: '利用規約', url: '/tos' },
  { text: 'プライバシーポリシー', url: '/privacy-policy' },
];

export function Footer() {
  return (
    <footer className='container max-w-6xl py-32'>
      <div className='grid grid-cols-2 gap-8 lg:grid-cols-6'>
        <div className='col-span-2 mb-8 lg:mb-0'>
          <Logo height={20} />
          <p className='mt-4 font-bold'>あなたのDiscordサーバーをもっと便利に。</p>
        </div>
        {menuItems.map((section) => (
          <div key={section.title}>
            <h3 className='mb-4'>{section.title}</h3>
            <ul className='text-muted-foreground space-y-4'>
              {section.links.map((link) => (
                <li key={link.text} className='hover:text-primary'>
                  <Link href={link.url as Route}>{link.text}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className='text-muted-foreground mt-24 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium md:flex-row md:items-center'>
        <p>© {new Date().getFullYear()} nonibot. All rights reserved.</p>
        <ul className='flex gap-4'>
          {bottomLinks.map((link) => (
            <li key={link.text} className='hover:text-primary underline'>
              <Link href={link.url as Route}>{link.text}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
