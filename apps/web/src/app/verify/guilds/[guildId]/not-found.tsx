import { LockIcon } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
