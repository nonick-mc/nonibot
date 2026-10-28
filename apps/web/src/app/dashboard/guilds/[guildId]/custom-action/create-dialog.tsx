'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ComponentProps, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { FormDevTool } from '@/components/form';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledInput } from '@/components/rhf/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { createCustomAction } from './action';
import { createFormSchema } from './schema';

type CreateDialogProps = {
  children: ComponentProps<typeof DialogTrigger>['render'];
};

export function CreateDialog({ children }: CreateDialogProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm({ resolver: zodResolver(createFormSchema), defaultValues: { name: '' } });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof createFormSchema>) {
    const res = await createCustomAction.bind(null, guildId)(values);
    if (res.serverError || !res.data) {
      return toast.error(res.serverError ?? 'アクションの作成中に問題が発生しました。');
    }
    toast.success('アクションを作成しました。');
    router.push(`/dashboard/guilds/${guildId}/custom-action/${res.data.id}`);
  }

  return (
    <FormProvider {...form}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={children} />
        <DialogContent className='sm:max-w-md'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4'>
            <FormDevTool />
            <DialogHeader>
              <DialogTitle>アクションを作成</DialogTitle>
            </DialogHeader>
            <FieldGroup className='py-4'>
              <ControlledField control={form.control} name='name'>
                <FieldContent>
                  <ControlledFieldLabel>アクション名</ControlledFieldLabel>
                  <FieldDescription>
                    他のアクション名と重複しない名前にする必要があります。
                  </FieldDescription>
                </FieldContent>
                <ControlledInput maxLength={50} placeholder='例: お知らせロールの切り替え' />
                <ControlledFieldError />
              </ControlledField>
            </FieldGroup>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : <ArrowRightIcon />}
                次へ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
