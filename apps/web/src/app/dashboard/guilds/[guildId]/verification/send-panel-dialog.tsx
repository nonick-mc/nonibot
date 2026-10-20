'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import { SendIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm, useFormContext, useFormState } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { hasPermission } from '@/lib/discord/utils';
import { sendPanelAction } from './action';
import { sendPanelFormSchema } from './schema';

const sendPermission = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;

type SendPanelDialogProps = {
  channels: InternalApiChannel[];
};

/** 設定フォーム内に置く。未保存の変更がある間は、保存済みの設定との差異を避けるため送信できない */
export function SendPanelDialog({ channels }: SendPanelDialogProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const bindSendPanelAction = sendPanelAction.bind(null, guildId);
  const [open, setOpen] = useState(false);
  const { control } = useFormContext();
  const { isDirty } = useFormState({ control });

  const form = useForm({
    resolver: zodResolver(sendPanelFormSchema),
    defaultValues: { channelId: '' },
  });

  async function onSubmit(values: z.infer<typeof sendPanelFormSchema>) {
    const res = await bindSendPanelAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? 'メッセージの送信中に問題が発生しました。');
    }
    toast.success('認証メッセージを送信しました。');
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip disabled={!isDirty}>
        <TooltipTrigger render={<span />}>
          <DialogTrigger
            render={
              <Button type='button' disabled={isDirty}>
                <SendIcon />
                メッセージを送信
              </Button>
            }
          />
        </TooltipTrigger>
        <TooltipContent>先に設定を保存してください</TooltipContent>
      </Tooltip>
      <DialogContent>
        <FormProvider {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(onSubmit)(e);
            }}
          >
            <DialogHeader>
              <DialogTitle>認証メッセージを送信</DialogTitle>
            </DialogHeader>
            <FieldGroup className='py-8'>
              <ControlledField control={form.control} name='channelId'>
                <FieldContent>
                  <ControlledFieldLabel>送信先のチャンネル</ControlledFieldLabel>
                  <FieldDescription>
                    nonibotが「メッセージを送信」権限を持っているテキストチャンネルを選択できます。
                  </FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledChannelSelect
                  items={channels}
                  includeTypes={[ChannelType.GuildText]}
                  disabledItemFilter={(channel) =>
                    !hasPermission(channel.bot_permissions, sendPermission)
                  }
                />
              </ControlledField>
            </FieldGroup>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                キャンセル
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner /> : <SendIcon />}
                送信
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
