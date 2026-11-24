'use client';

import { ArrowRotateLeft, CircleXmark } from '@gravity-ui/icons';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { GravityIcon } from '@/components/gravity-icon';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { reset: () => void }) {
  const router = useRouter();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <Alert variant='destructive'>
      <GravityIcon icon={CircleXmark} />
      <AlertTitle>サーバーの取得に失敗しました</AlertTitle>
      <AlertDescription>
        ページの読み込み中に予期しないエラーが発生しました。時間をおいて再度アクセスしてください。
      </AlertDescription>
      <AlertAction>
        <Button size='sm' variant='outline' onClick={handleRetry}>
          <GravityIcon icon={ArrowRotateLeft} />
          再試行
        </Button>
      </AlertAction>
    </Alert>
  );
}
