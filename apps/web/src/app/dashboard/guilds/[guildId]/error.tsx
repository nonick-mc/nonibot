'use client';

import { AlertCircleIcon, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';
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
      <AlertCircleIcon />
      <AlertTitle>ページの読み込みに失敗しました</AlertTitle>
      <AlertDescription>
        ページの読み込み中に予期しないエラーが発生しました。時間をおいて再度アクセスしてください。
      </AlertDescription>
      <AlertAction>
        <Button variant='outline' onClick={handleRetry}>
          <RotateCw />
          再試行
        </Button>
      </AlertAction>
    </Alert>
  );
}
