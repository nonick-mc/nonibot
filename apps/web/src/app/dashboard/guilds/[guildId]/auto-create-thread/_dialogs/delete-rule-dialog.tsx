'use client';

import type { autoCreateThreadRule } from '@repo/database';
import type { InferSelectModel } from 'drizzle-orm';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { deleteRuleAction } from '../action';

type DeleteRuleDialogProps = {
  targetChannelName: string;
  rule: InferSelectModel<typeof autoCreateThreadRule>;
};

export function DeleteRuleDialog({ targetChannelName, rule }: DeleteRuleDialogProps) {
  const bindDeleteRuleAction = deleteRuleAction.bind(null, rule.guildId, rule.channelId);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleAction() {
    setIsLoading(true);
    const res = await bindDeleteRuleAction();
    setIsLoading(false);
    if (res.serverError || res.validationErrors) {
      return toast.error('チャンネルの削除に失敗しました。');
    }
    setOpen(false);
    toast.success('チャンネルを削除しました。');
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant='outline' size='icon'>
            <Trash2Icon className='text-destructive' />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            設定からチャンネル<span className='font-extrabold'>「#{targetChannelName}」</span>
            を削除しますか？この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} variant='destructive' disabled={isLoading}>
            {isLoading ? <Spinner className='mt-0.5' /> : <Trash2Icon className='mt-0.5' />}
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
