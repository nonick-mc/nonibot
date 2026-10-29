'use client';

import { Trash2Icon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { deleteSavedMessageAction } from './action';

type DeleteDialogProps = {
  id: string;
  name: string;
  children?: ComponentProps<typeof AlertDialogTrigger>['render'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeleteDialog({ id, name, children, open, onOpenChange }: DeleteDialogProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDiscordMessage, setDeleteDiscordMessage] = useState(false);

  async function onDelete() {
    setIsLoading(true);
    const res = await deleteSavedMessageAction.bind(null, guildId)({ id, deleteDiscordMessage });
    if (res.serverError || res.validationErrors) {
      setIsLoading(false);
      return toast.error(res.serverError ?? 'メッセージの削除中に問題が発生しました。');
    }
    toast.success('保存したメッセージを削除しました。');
    router.push(`/dashboard/guilds/${guildId}/custom-message`);
    onOpenChange?.(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger render={children} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>保存済みのメッセージを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            メッセージ<span className='font-bold'>「{name}」</span>
            を削除しますか？この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field orientation='horizontal'>
          <Checkbox
            id='delete-discord-message'
            checked={deleteDiscordMessage}
            onCheckedChange={setDeleteDiscordMessage}
            disabled={isLoading}
          />
          <FieldLabel htmlFor='delete-discord-message'>Discordのメッセージも削除する</FieldLabel>
        </Field>
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
