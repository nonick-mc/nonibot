import dayjs from 'dayjs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { blog } from '@/lib/source';

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();
  const Mdx = page.data.body;

  return (
    <main className='container max-w-200 mx-auto py-8'>
      <div className='w-full flex flex-col gap-6'>
        <Button
          className='mr-auto'
          variant='outline'
          render={
            <Link href='/blog'>
              <ArrowLeftIcon />
              戻る
            </Link>
          }
          nativeButton={false}
        />
        <h1 className='text-3xl font-black'>{page.data.title}</h1>
        {page.data.description && (
          <p className='text-fd-muted-foreground'>{page.data.description}</p>
        )}
        <div className='flex items-center gap-2 text-fd-muted-foreground'>
          <Avatar>
            <AvatarImage src={page.data.authorImage} />
            <AvatarFallback>{page.data.author.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <p>{page.data.author}</p>
          <span>·</span>
          <time dateTime={page.data.date.toString()}>
            {dayjs(page.data.date).format('YYYY/MM/DD')}
          </time>
        </div>
      </div>
      <article className='prose w-full pt-12'>
        <Mdx components={defaultMdxComponents} />
      </article>
    </main>
  );
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
