'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LeaveMessagePlaceholders } from '@repo/placeholders';
import {
  type APIGuildChannel,
  ChannelType,
  ComponentType,
  type GuildChannelType,
} from 'discord-api-types/v10';
import { PencilIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Controller, FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import { ComponentsV2EditorDialog } from '@/components/discord/components-v2-editor/dialog';
import {
  DiscordMessageContext,
  type DiscordMessageContextValue,
} from '@/components/discord/message-context';
import { DiscordMessage } from '@/components/discord/preview/message';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { Links } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { updateSettingAction } from './action';
import { formSchema } from './schema';

type FormProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  defaultValues?: z.infer<typeof formSchema>;
} & DiscordMessageContextValue;

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

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 pb-24'>
        <DiscordMessageContext.Provider
          value={{
            roles: roles?.filter((role) => role.id !== guildId),
            channels,
            emojis,
            placeholders: LeaveMessagePlaceholders,
          }}
        >
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
                          <ControlledFieldLabel>
                            メッセージを送信するチャンネル
                          </ControlledFieldLabel>
                          <ControlledFieldError />
                        </FieldContent>
                        <ControlledChannelSelect
                          items={channels}
                          includeTypes={[ChannelType.GuildText]}
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
                      <div
                        className={cn('sm:flex-1 flex flex-col gap-2', {
                          'opacity-50': !enabled,
                        })}
                      >
                        <Watch
                          control={form.control}
                          name='messageComponents'
                          render={(messageComponents) => (
                            <div className='max-sm:p-4 p-6 bg-discord-background border rounded-lg max-h-100 overflow-y-auto scroll-fade-y no-scrollbar'>
                              <DiscordMessage
                                components={messageComponents ?? []}
                                username='nonibot'
                                avatarUrl={Links.AvatarUrl}
                                showAppTag
                                verified
                              />
                            </div>
                          )}
                        />
                        <Controller
                          control={form.control}
                          name='messageComponents'
                          render={({ field }) => (
                            <ComponentsV2EditorDialog
                              onSubmit={field.onChange}
                              defaultValues={field.value ?? []}
                            >
                              <Button variant='outline' className='w-full' disabled={!enabled}>
                                <PencilIcon />
                                メッセージを編集
                              </Button>
                            </ComponentsV2EditorDialog>
                          )}
                        />
                      </div>
                    </ControlledField>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </DiscordMessageContext.Provider>
        <FormDevTool />
        <FormChangePublisher />
      </form>
    </FormProvider>
  );
}
