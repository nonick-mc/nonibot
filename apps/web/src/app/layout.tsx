import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { RouterEventsProvider } from '@/components/router-events-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'nonibot',
    template: '%s - nonibot',
  },
  description: 'あなたのDiscordサーバーをもっと便利に。',
};

export const viewport: Viewport = {
  themeColor: '#0073f5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='ja'
      suppressHydrationWarning
      className={cn('antialiased', geistMono.variable, 'font-sans', notoSansJP.variable)}
    >
      <body className='min-h-screen flex flex-col'>
        <RootProvider
          i18n={{
            translations: {
              search: '検索...',
            },
          }}
          theme={{
            attribute: 'class',
            defaultTheme: 'system',
            enableSystem: true,
            disableTransitionOnChange: true,
          }}
        >
          <NuqsAdapter>
            {children}
            <Toaster />
            <RouterEventsProvider />
          </NuqsAdapter>
        </RootProvider>
      </body>
    </html>
  );
}
