'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared/types';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import { SendIcon, TriangleAlertIcon } from 'lucide-react';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import type { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledInput } from '@/components/rhf/input';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { channelFormSchema } from '../schema';

const defaultSaveName = '無題のメッセージ';

type SendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: InternalApiChannel[];
  isFull: boolean;
  onSubmit: (values: { channelId: string; name?: string }) => Promise<boolean>;
};

export function SendDialog({ open, onOpenChange, channels, isFull, onSubmit }: SendDialogProps) {
  const form = useForm({
    resolver: zodResolver(channelFormSchema),
    defaultValues: { channelId: '', save: true, name: '' },
  });

  async function handleSubmit({ channelId, save, name }: z.infer<typeof channelFormSchema>) {
    const ok = await onSubmit({
      channelId,
      name: !isFull && save ? name || defaultSaveName : undefined,
    });
    if (ok) form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>メッセージを送信</DialogTitle>
            </DialogHeader>
            <div className='py-6 flex flex-col gap-4'>
              <Card>
                <CardContent>
                  <FieldGroup>
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
                        includeTypes={[ChannelType.GuildText, ChannelType.GuildAnnouncement]}
                        requirePermissions={[PermissionFlagsBits.SendMessages]}
                      />
                    </ControlledField>
                  </FieldGroup>
                </CardContent>
              </Card>
              {isFull ? (
                <Alert variant='warning'>
                  <TriangleAlertIcon />
                  <AlertTitle>保存できるメッセージが上限に達しています</AlertTitle>
                  <AlertDescription>
                    このメッセージは送信されますが、保存されません。
                  </AlertDescription>
                </Alert>
              ) : (
                <Card>
                  <CardContent>
                    <FieldGroup>
                      <ControlledField control={form.control} name='save' orientation='horizontal'>
                        <FieldContent>
                          <ControlledFieldLabel>メッセージを保存する</ControlledFieldLabel>
                          <FieldDescription>
                            保存したメッセージはカスタムメッセージ一覧に表示され、後から編集することができます。
                          </FieldDescription>
                        </FieldContent>
                        <ControlledSwitch />
                      </ControlledField>
                      <Watch
                        control={form.control}
                        name='save'
                        render={(save) =>
                          save && (
                            <>
                              <FieldSeparator />
                              <ControlledField control={form.control} name='name'>
                                <FieldContent>
                                  <ControlledFieldLabel>メッセージの名前</ControlledFieldLabel>
                                  <ControlledFieldError />
                                </FieldContent>
                                <ControlledInput maxLength={50} placeholder={defaultSaveName} />
                              </ControlledField>
                            </>
                          )
                        }
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
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
