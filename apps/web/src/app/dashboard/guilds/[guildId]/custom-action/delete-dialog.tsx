'use client';

import { Trash2Icon, TriangleAlertIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { deleteCustomAction } from './action';

type DeleteDialogProps = {
  id: string;
  name: string;
  usageCount: number;
  /** 指定すると、これを押して開くトリガーになる */
  children?: ComponentProps<typeof AlertDialogTrigger>['render'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeleteDialog({
  id,
  name,
  usageCount,
  children,
  open,
  onOpenChange,
}: DeleteDialogProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onDelete() {
    setIsLoading(true);
    const res = await deleteCustomAction.bind(null, guildId)({ id });
    if (res.serverError || res.validationErrors) {
      setIsLoading(false);
      return toast.error(res.serverError ?? 'アクションの削除中に問題が発生しました。');
    }
    toast.success('アクションを削除しました。');
    router.push(`/dashboard/guilds/${guildId}/custom-action`);
    onOpenChange?.(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger render={children} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アクションを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            アクション<span className='font-bold'>「{name}」</span>
            を削除しますか？この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {usageCount > 0 && (
          <Alert variant='warning'>
            <TriangleAlertIcon />
            <AlertTitle>使用中のメッセージがあります</AlertTitle>
            <AlertDescription>
              このアクションは、{usageCount}件
              の保存されたメッセージで使用中です。削除すると、メッセージのボタンは動作しなくなります。
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} variant='destructive' disabled={isLoading}>
            {isLoading ? <Spinner className='mt-0.5' /> : <Trash2Icon className='mt-0.5' />}
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
