'use client';

import { CircleAlertIcon } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { VerificationHeader } from './header';

export default function ErrorPage() {
  return (
    <>
      <VerificationHeader />
      <CardContent>
        <Empty className='px-0'>
          <EmptyHeader>
            <EmptyMedia className='bg-destructive/10' variant='icon'>
              <CircleAlertIcon className='stroke-destructive' />
            </EmptyMedia>
            <EmptyTitle>問題が発生しました</EmptyTitle>
            <EmptyDescription>
              ページの読み込み中に予期しない問題が発生しました。時間をおいて再度アクセスしてください。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </>
  );
}
