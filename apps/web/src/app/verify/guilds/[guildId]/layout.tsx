import { Card } from '@/components/ui/card';

export default function Layout({ children }: LayoutProps<'/verify/guilds/[guildId]'>) {
  return (
    <main className='min-h-dvh flex items-center justify-center p-6'>
      <Card className='max-w-sm w-full gap-8'>{children}</Card>
    </main>
  );
}
