import dayjs from 'dayjs';
import type { Route } from 'next';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { blog } from '@/lib/source';

export default function Home() {
  const posts = blog.getPages();

  return (
    <main className='container flex-1 max-w-350 w-full mx-auto py-8'>
      <h1 className='text-3xl font-black mb-8 font-mono'>最新情報</h1>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {posts.map((post) => (
          <Link key={post.url} href={post.url as Route}>
            <Card className='hover:ring-ring'>
              <CardHeader>
                <h2 className='text-lg font-semibold mb-2'>{post.data.title}</h2>
                <p className='mb-4'>{post.data.description}</p>
              </CardHeader>
              <CardFooter className='flex items-center justify-between'>
                <time className='text-fd-muted-foreground' dateTime={post.data.date.toString()}>
                  {dayjs(post.data.date).format('YYYY年MM月DD日')}
                </time>
                <Avatar className='ml-auto'>
                  <AvatarImage src={post.data.authorImage} alt={post.data.author} />
                  <AvatarFallback>{post.data.author.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
