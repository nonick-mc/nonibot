'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { levelNotifyModeEnum } from '@repo/database';
import { levelNotifyMessagePlaceholders } from '@repo/placeholders';
import type { InternalApiChannel } from '@repo/shared/types';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import { PencilIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
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
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { updateSettingAction } from './action';
import { RoleRewardsField } from './role-rewards';
import { formSchema } from './schema';

const notifyModeLabels: Record<(typeof levelNotifyModeEnum.enumValues)[number], string> = {
  sameChannel: 'メッセージを送信したチャンネル',
  fixedChannel: '指定したチャンネル',
  none: '通知しない',
};

type FormProps = {
  channels: InternalApiChannel[];
  botHighestRolePosition: number;
  setting?: z.infer<typeof formSchema>;
} & Pick<MessageResources, 'emojis' | 'roles'>;

export function SettingForm({
  setting,
  channels,
  emojis,
  roles,
  botHighestRolePosition,
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

  const resources: MessageResources = {
    roles: roles?.filter((role) => role.id !== guildId),
    channels,
    emojis,
    placeholders: levelNotifyMessagePlaceholders,
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 pb-24'>
        <Card className='bg-card/50'>
          <CardContent>
            <FieldGroup>
              <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                <FieldContent>
                  <ControlledFieldLabel>レベルシステムを有効にする</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <Watch
          control={form.control}
          name='enabled'
          render={(enabled) => (
            <>
              <Card className='bg-card/50'>
                <CardHeader>
                  <CardTitle>レベルアップ通知</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <ControlledField
                      control={form.control}
                      name='notifyMode'
                      orientation='responsive'
                      align='center'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>通知の送信先</ControlledFieldLabel>
                        <FieldDescription>
                          レベルアップしたことを通知するチャンネルを選択します。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSelect>
                        <ControlledSelectTrigger className='sm:min-w-xs'>
                          <SelectValue>
                            {(value: keyof typeof notifyModeLabels) => notifyModeLabels[value]}
                          </SelectValue>
                        </ControlledSelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {levelNotifyModeEnum.enumValues.map((mode) => (
                              <SelectItem key={mode} value={mode}>
                                {notifyModeLabels[mode]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </ControlledSelect>
                    </ControlledField>
                    <Watch
                      control={form.control}
                      name='notifyMode'
                      render={(notifyMode) => (
                        <>
                          {notifyMode === 'fixedChannel' && (
                            <>
                              <FieldSeparator />
                              <ControlledField
                                control={form.control}
                                name='notifyChannel'
                                orientation='responsive'
                                align='center'
                                disabled={!enabled || notifyMode !== 'fixedChannel'}
                              >
                                <FieldContent>
                                  <ControlledFieldLabel>
                                    通知を送信するチャンネル
                                  </ControlledFieldLabel>
                                  <FieldDescription>
                                    テキストチャンネルを指定できます。
                                  </FieldDescription>
                                  <ControlledFieldError />
                                </FieldContent>
                                <ControlledChannelSelect
                                  items={channels}
                                  includeTypes={[ChannelType.GuildText]}
                                  className='sm:min-w-xs'
                                  requirePermissions={[PermissionFlagsBits.SendMessages]}
                                />
                              </ControlledField>
                            </>
                          )}
                          <FieldSeparator />
                          <ControlledField
                            control={form.control}
                            name='notifyMessageComponents'
                            orientation='responsive'
                            disabled={!enabled || notifyMode === 'none'}
                          >
                            <FieldContent>
                              <ControlledFieldLabel>通知メッセージ</ControlledFieldLabel>
                              <FieldDescription>
                                レベルアップ時に送信されるメッセージをカスタマイズします。
                              </FieldDescription>
                            </FieldContent>
                            <div className='sm:flex-1 flex flex-col gap-2'>
                              <Watch
                                control={form.control}
                                name='notifyMessageComponents'
                                render={(notifyMessageComponents) => (
                                  <DiscordMessage
                                    components={notifyMessageComponents ?? []}
                                    resources={resources}
                                    disabled={!enabled || notifyMode === 'none'}
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
                        </>
                      )}
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
              <Card className='bg-card/50'>
                <CardHeader>
                  <CardTitle>ロール報酬</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <RoleRewardsField
                      roles={(roles ?? []).filter(
                        (role) =>
                          !role.managed &&
                          role.id !== guildId &&
                          role.position <= botHighestRolePosition,
                      )}
                      allRoles={roles ?? []}
                      disabled={!enabled}
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
              <Card className='bg-card/50'>
                <CardHeader>
                  <CardTitle>除外設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <ControlledField
                      control={form.control}
                      name='ignoreChannels'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>経験値を付与しないチャンネル</ControlledFieldLabel>
                        <FieldDescription>
                          この設定はチャンネルのスレッドや、カテゴリ内のチャンネルにも適用されます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledChannelSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        items={channels}
                        multiple
                      />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='ignoreRoles'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>経験値を付与しないロール</ControlledFieldLabel>
                        <FieldDescription>
                          選択したロールを持つユーザーには経験値が付与されないようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledRoleSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        items={roles?.filter((role) => role.id !== guildId) ?? []}
                        multiple
                      />
                    </ControlledField>
                  </FieldGroup>
                </CardContent>
              </Card>
            </>
          )}
        />
        <FormChangePublisher />
      </form>
      <FormDevTool />
    </FormProvider>
  );
}
