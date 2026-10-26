'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared/types';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import { SendIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ComponentsV2EditorPanel } from '@/components/discord/components-v2-editor/panel';
import type { MessageResources } from '@/components/discord/resources';
import { FormDevTool } from '@/components/form';
import { Header } from '@/components/header';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  ControlledFieldProvider,
} from '@/components/rhf/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { sendMessageAction } from './action';
import { editorFormSchema, sendFormSchema } from './schema';

type FormProps = {
  channels: InternalApiChannel[];
} & Pick<MessageResources, 'emojis' | 'roles'>;

export function SendMessageForm({ channels, emojis, roles }: FormProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const bindSendMessageAction = sendMessageAction.bind(null, guildId);
  const [open, setOpen] = useState(false);

  const editorForm = useForm({
    resolver: zodResolver(editorFormSchema),
    defaultValues: { components: [] },
  });
  const channelForm = useForm({
    resolver: zodResolver(sendFormSchema.pick({ channelId: true })),
    defaultValues: { channelId: '' },
  });

  async function onSend({ channelId }: { channelId: string }) {
    const components = editorForm.getValues('components');
    const res = await bindSendMessageAction({ channelId, components });
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? 'メッセージの送信中に問題が発生しました。');
    }
    toast.success('メッセージを送信しました。');
    setOpen(false);
    channelForm.reset();
  }

  return (
    <FormProvider {...editorForm}>
      <FormDevTool />
      <Header
        title='カスタムメッセージ'
        description='サーバー内の任意のチャンネルにメッセージを送信します。'
      >
        <Button className='max-sm:w-full' onClick={editorForm.handleSubmit(() => setOpen(true))}>
          <SendIcon />
          送信
        </Button>
      </Header>
      <div className='relative flex-1 min-h-96'>
        <Card className='absolute inset-0 bg-card/50'>
          <CardContent className='flex flex-col gap-3 flex-1 min-h-0'>
            <ControlledFieldProvider control={editorForm.control} name='components'>
              <ControlledFieldError />
            </ControlledFieldProvider>
            <ComponentsV2EditorPanel
              resources={{ emojis, roles, channels }}
              footer={(addMenu) => <div className='flex'>{addMenu}</div>}
            />
          </CardContent>
        </Card>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <FormProvider {...channelForm}>
            <form onSubmit={channelForm.handleSubmit(onSend)}>
              <DialogHeader>
                <DialogTitle>メッセージを送信</DialogTitle>
              </DialogHeader>
              <FieldGroup className='py-8'>
                <ControlledField control={channelForm.control} name='channelId'>
                  <FieldContent>
                    <ControlledFieldLabel>送信先のチャンネル</ControlledFieldLabel>
                    <FieldDescription>
                      nonibotが「メッセージを送信」権限を持っているテキストチャンネルを選択できます。
                    </FieldDescription>
                    <ControlledFieldError />
                  </FieldContent>
                  <ControlledChannelSelect
                    items={channels}
                    includeTypes={[ChannelType.GuildText, ChannelType.GuildAnnouncement]}
                    requirePermissions={[PermissionFlagsBits.SendMessages]}
                  />
                </ControlledField>
              </FieldGroup>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                  disabled={channelForm.formState.isSubmitting}
                >
                  キャンセル
                </Button>
                <Button type='submit' disabled={channelForm.formState.isSubmitting}>
                  {channelForm.formState.isSubmitting ? <Spinner /> : <SendIcon />}
                  送信
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
