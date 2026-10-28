'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared/types';
import { SendIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { ComponentsV2EditorPanel } from '@/components/discord/components-v2-editor/panel';
import type { MessageResources } from '@/components/discord/resources';
import { FormDevTool } from '@/components/form';
import { Header } from '@/components/header';
import { ControlledFieldError, ControlledFieldProvider } from '@/components/rhf/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { sendMessageAction } from '../action';
import { editorFormSchema } from '../schema';
import { SendDialog } from './send-dialog';

type FormProps = {
  channels: InternalApiChannel[];
  isFull: boolean;
} & Pick<MessageResources, 'emojis' | 'roles' | 'allowedComponents'>;

export function SendMessageForm({ channels, emojis, roles, allowedComponents, isFull }: FormProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const bindSendMessageAction = sendMessageAction.bind(null, guildId);
  const [open, setOpen] = useState(false);

  const editorForm = useForm({
    resolver: zodResolver(editorFormSchema),
    defaultValues: { components: [] },
  });
  const isEmpty = useWatch({ control: editorForm.control, name: 'components' }).length === 0;

  async function onSend({ channelId, name }: { channelId: string; name?: string }) {
    const res = await bindSendMessageAction({
      channelId,
      components: editorForm.getValues('components'),
      name,
    });
    if (res.serverError || res.validationErrors) {
      toast.error(res.serverError ?? 'メッセージの送信中に問題が発生しました。');
      return false;
    }
    toast.success('メッセージを送信しました。');
    setOpen(false);
    if (name) router.push(`/dashboard/guilds/${guildId}/custom-message`);
    return true;
  }

  return (
    <FormProvider {...editorForm}>
      <FormDevTool />
      <Header title='新規作成' description='任意のチャンネルにメッセージを送信します。' />
      <div className='relative flex-1 min-h-96'>
        <Card className='absolute inset-0 bg-card/50'>
          <CardContent className='flex flex-col gap-3 flex-1 min-h-0'>
            <ControlledFieldProvider control={editorForm.control} name='components'>
              <ControlledFieldError />
            </ControlledFieldProvider>
            <ComponentsV2EditorPanel
              resources={{ emojis, roles, channels, allowedComponents }}
              footer={(addMenu) => (
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  {addMenu}
                  <Button
                    className='max-sm:w-full'
                    onClick={editorForm.handleSubmit(() => setOpen(true))}
                    disabled={isEmpty}
                  >
                    <SendIcon />
                    送信
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
      <SendDialog
        open={open}
        onOpenChange={setOpen}
        channels={channels}
        isFull={isFull}
        onSubmit={onSend}
      />
    </FormProvider>
  );
}
