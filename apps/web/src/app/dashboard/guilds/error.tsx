'use client';

import { AlertCircleIcon, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Button } from '@/components/ui/button';
import { Navbar } from '../(guild-select)/navbar';

export default function ErrorPage({ reset }: { reset: () => void }) {
  const router = useRouter();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <>
      <Navbar />
      <main className='container max-w-350 flex w-full flex-col gap-6 py-6'>
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>ダッシュボードの読み込みに失敗しました</AlertTitle>
          <AlertDescription>
            Botとの通信中に予期しないエラーが発生しました。時間をおいて再度アクセスしてください。
          </AlertDescription>
          <AlertAction>
            <Button variant='outline' onClick={handleRetry}>
              <RotateCw />
              再試行
            </Button>
          </AlertAction>
        </Alert>
      </main>
    </>
  );
}
