import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...baseOptions()}
      style={{ '--fd-layout-width': '1400px' } as object}
      links={[
        {
          text: 'ドキュメント',
          url: '/docs',
        },
        {
          text: 'ブログ',
          url: '/blog',
        },
        {
          type: 'custom',
          secondary: true,
          children: (
            <Button render={<Link href='/dashboard'>ダッシュボード</Link>} nativeButton={false} />
          ),
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
