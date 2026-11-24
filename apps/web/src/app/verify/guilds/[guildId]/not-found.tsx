import { LockIcon } from 'lucide-react';
import { CardContent } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { VerificationHeader } from './header';

export default function NotFound() {
  return (
    <>
      <VerificationHeader />
      <CardContent>
        <Empty className='px-0'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <LockIcon />
            </EmptyMedia>
            <EmptyTitle>認証を行うことができません</EmptyTitle>
            <EmptyDescription>
              サーバーが存在しないか、認証を行うためのアクセス権限がありません。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </>
  );
}
