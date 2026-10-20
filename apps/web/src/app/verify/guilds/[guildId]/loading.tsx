import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationHeader } from './header';

export default function Loading() {
  return (
    <>
      <VerificationHeader />
      <CardContent className='flex flex-col items-center gap-8'>
        <div className='flex flex-col items-center gap-3'>
          <Skeleton className='size-28 rounded-full' />
          <Skeleton className='h-7 w-37.5' />
        </div>
        <div className='w-full flex flex-col gap-2'>
          <Skeleton className='h-9' />
          <Skeleton className='h-9' />
        </div>
      </CardContent>
    </>
  );
}
