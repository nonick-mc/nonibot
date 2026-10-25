'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { leaveMessagePlaceholders } from '@repo/placeholders';
import type { InternalApiChannel } from '@repo/shared/types';
import { ChannelType } from 'discord-api-types/v10';
import { PencilIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import { DiscordMessage } from '@/components/discord/preview/message';
import type { MessageResources } from '@/components/discord/resources';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { ControlledButton } from '@/components/rhf/button';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import { ControlledComponentsV2EditorDialog } from '@/components/rhf/components-v2-editor-dialog';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { updateSettingAction } from './action';
import { formSchema } from './schema';

type FormProps = {
  channels: InternalApiChannel[];
  defaultValues?: z.infer<typeof formSchema>;
} & Pick<MessageResources, 'emojis' | 'roles'>;

export function SettingForm({ channels, defaultValues, roles, emojis }: FormProps) {
  const { guildId }: { guildId: string } = useParams();
  const bindUpdateSettingAction = updateSettingAction.bind(null, guildId);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await bindUpdateSettingAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error('設定の更新中に問題が発生しました。時間をおいて再度お試しください。');
    }
    form.reset(values);
  }

  const resources: MessageResources = {
    roles: roles?.filter((role) => role.id !== guildId),
    channels,
    emojis,
    placeholders: leaveMessagePlaceholders,
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 pb-24'>
        <Card className='bg-card/50'>
          <CardContent>
            <FieldGroup>
              <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                <FieldContent>
                  <ControlledFieldLabel>退室メッセージを有効にする</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>全般設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Watch
                control={form.control}
                name={'enabled'}
                render={(enabled) => (
                  <>
                    <ControlledField
                      control={form.control}
                      name='channel'
                      orientation='responsive'
                      align='center'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>メッセージを送信するチャンネル</ControlledFieldLabel>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledChannelSelect
                        items={channels}
                        includeTypes={[ChannelType.GuildText]}
                        className='sm:min-w-xs'
                      />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='ignoreBot'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          BOT退室時にメッセージを送信しない
                        </ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、BOTがサーバーから削除された際にメッセージが送信されないようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
                  </>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>メッセージ設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Watch
                control={form.control}
                name='enabled'
                render={(enabled) => (
                  <ControlledField
                    control={form.control}
                    name='messageComponents'
                    orientation='responsive'
                    disabled={!enabled}
                  >
                    <FieldContent>
                      <ControlledFieldLabel>メッセージ</ControlledFieldLabel>
                      <FieldDescription>
                        チャンネルに送信されるメッセージをカスタマイズします。
                      </FieldDescription>
                    </FieldContent>
                    <div className='sm:flex-1 flex flex-col gap-2'>
                      <Watch
                        control={form.control}
                        name='messageComponents'
                        render={(messageComponents) => (
                          <DiscordMessage
                            components={messageComponents ?? []}
                            resources={resources}
                            disabled={!enabled}
                            className='max-h-100'
                          />
                        )}
                      />
                      <ControlledComponentsV2EditorDialog resources={resources}>
                        <ControlledButton variant='outline' className='w-full'>
                          <PencilIcon />
                          メッセージを編集
                        </ControlledButton>
                      </ControlledComponentsV2EditorDialog>
                    </div>
                  </ControlledField>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
        <FormDevTool />
        <FormChangePublisher />
      </form>
    </FormProvider>
  );
}
