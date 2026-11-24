import { Separator } from '@/components/shadcn/separator';
import { Footer } from '../footer';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <main className='overflow-hidden'>{children}</main>
      <Separator />
      <Footer />
    </>
  );
}
