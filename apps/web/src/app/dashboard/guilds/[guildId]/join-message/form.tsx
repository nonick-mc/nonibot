'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { joinMessagePlaceholders } from '@repo/placeholders';
import { Links } from '@repo/shared';
import { type APIGuildChannel, ChannelType, type GuildChannelType } from 'discord-api-types/v10';
import { PencilIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Controller, FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ComponentsV2EditorDialog } from '@/components/discord/components-v2-editor/dialog';
import {
  DiscordMessageContext,
  type DiscordMessageContextValue,
} from '@/components/discord/message-context';
import { DiscordMessage } from '@/components/discord/preview/message';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { Badge } from '@/components/reui/badge';
import { ControlledButton } from '@/components/rhf/button';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import { ControlledComponentsV2EditorDialog } from '@/components/rhf/components-v2-editor-dialog';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { updateSettingAction } from './action';
import { formSchema } from './schema';
import { SendTriggerSelect } from './send-trigger-select';

type FormProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  setting?: z.infer<typeof formSchema>;
  enabledVerificationGate: boolean;
} & DiscordMessageContextValue;

export function SettingForm({
  setting,
  channels,
  emojis,
  roles,
  enabledVerificationGate,
}: FormProps) {
  const { guildId }: { guildId: string } = useParams();
  const bindUpdateSettingAction = updateSettingAction.bind(null, guildId);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: setting,
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
            placeholders: joinMessagePlaceholders,
          }}
        >
          <Card className='bg-card/50'>
            <CardHeader>
              <CardTitle>サーバー</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                  <FieldContent>
                    <ControlledFieldLabel>チャンネルにメッセージを送信する</ControlledFieldLabel>
                    <FieldDescription>
                      ユーザー入室時、特定のチャンネルへメッセージを送信します。
                    </FieldDescription>
                    <ControlledFieldError />
                  </FieldContent>
                  <ControlledSwitch />
                </ControlledField>
                <FieldSeparator />
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
                          className='sm:min-w-xs'
                        />
                      </ControlledField>
                      <FieldSeparator />
                      <ControlledField
                        control={form.control}
                        name='sendTrigger'
                        orientation='responsive'
                        disabled={!enabled || !enabledVerificationGate}
                      >
                        <FieldContent>
                          <ControlledFieldLabel>
                            メッセージを送信するタイミング<Badge>New</Badge>
                          </ControlledFieldLabel>
                          <FieldDescription>
                            入室メッセージを送信するタイミングを変更します。大規模なサーバーの場合は「
                            <Button
                              className='px-0 h-fit'
                              variant='link'
                              nativeButton={false}
                              render={
                                <Link href='https://support.discord.com/hc/ja/articles/1500000466882' />
                              }
                            >
                              サーバールール
                            </Button>
                            に同意した時」の設定を推奨します。
                          </FieldDescription>
                          {!enabledVerificationGate && (
                            <span className='text-warning'>
                              サーバールールが設定されていないため、この設定を変更することはできません。
                            </span>
                          )}
                          <ControlledFieldError />
                        </FieldContent>
                        <SendTriggerSelect />
                      </ControlledField>
                      <FieldSeparator />
                      <ControlledField
                        name='ignoreBot'
                        control={form.control}
                        disabled={!enabled}
                        orientation='horizontal'
                      >
                        <FieldContent>
                          <ControlledFieldLabel>
                            BOT入室時にメッセージを送信しない
                          </ControlledFieldLabel>
                          <FieldDescription>
                            有効にすると、BOTがサーバーに追加された際にメッセージが送信されないようになります。
                          </FieldDescription>
                          <ControlledFieldError />
                        </FieldContent>
                        <ControlledSwitch />
                      </ControlledField>
                      <FieldSeparator />
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
                              <div
                                className={cn(
                                  'max-sm:p-4 p-6 bg-discord-background border rounded-lg max-h-100 overflow-y-auto scroll-fade-y no-scrollbar',
                                  { 'opacity-50': !enabled },
                                )}
                              >
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
                          <ControlledComponentsV2EditorDialog>
                            <ControlledButton variant='outline' className='w-full'>
                              <PencilIcon />
                              メッセージを編集
                            </ControlledButton>
                          </ControlledComponentsV2EditorDialog>
                        </div>
                      </ControlledField>
                    </>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
          <Card className='bg-card/50'>
            <CardHeader>
              <CardTitle className='flex gap-2 items-center'>
                ダイレクトメッセージ<Badge>New</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <ControlledField control={form.control} name={'dmEnabled'} orientation='horizontal'>
                  <FieldContent>
                    <FieldContent>
                      <ControlledFieldLabel>DMにメッセージを送信する</ControlledFieldLabel>
                      <FieldDescription>
                        ユーザー入室時、そのユーザーのDMにメッセージを送信します。
                      </FieldDescription>
                      <ControlledFieldError />
                    </FieldContent>
                  </FieldContent>
                  <ControlledSwitch />
                </ControlledField>
                <FieldSeparator />
                <Watch
                  control={form.control}
                  name='dmEnabled'
                  render={(dmEnabled) => (
                    <ControlledField
                      control={form.control}
                      name={'dmMessageComponents'}
                      orientation='responsive'
                      disabled={!dmEnabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>メッセージ</ControlledFieldLabel>
                        <FieldDescription>
                          チャンネルに送信されるメッセージをカスタマイズします。
                        </FieldDescription>
                      </FieldContent>
                      <div className={'sm:flex-1 flex flex-col gap-2'}>
                        <Watch
                          control={form.control}
                          name='dmMessageComponents'
                          render={(dmMessageComponents) => (
                            <div
                              className={cn(
                                'max-sm:p-4 p-6 bg-discord-background border rounded-lg max-h-100 overflow-y-auto scroll-fade-y no-scrollbar',
                                { 'opacity-50': !dmEnabled },
                              )}
                            >
                              <DiscordMessage
                                components={dmMessageComponents ?? []}
                                username='nonibot'
                                avatarUrl={Links.AvatarUrl}
                                showAppTag
                                verified
                              />
                            </div>
                          )}
                        />
                        <ControlledComponentsV2EditorDialog>
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
          <FormChangePublisher />
        </DiscordMessageContext.Provider>
      </form>
      <FormDevTool />
    </FormProvider>
  );
}
