'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel, InternalApiRole } from '@repo/shared/types';
import { ChannelType } from 'discord-api-types/v10';
import { CircleAlertIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { Alert, AlertDescription } from '@/components/reui/alert';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { ControlledTextarea } from '@/components/rhf/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { updateSettingAction } from './action';
import { formSchema, MaxDomains, parseDomainList } from './schema';

type FormProps = {
  channels: InternalApiChannel[];
  roles: InternalApiRole[];
  defaultValues?: z.input<typeof formSchema>;
};

export function SettingForm({ channels, roles, defaultValues }: FormProps) {
  const { guildId }: { guildId: string } = useParams();
  const bindUpdateSettingAction = updateSettingAction.bind(null, guildId);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(values: z.output<typeof formSchema>) {
    const res = await bindUpdateSettingAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error('設定の更新中に問題が発生しました。時間をおいて再度お試しください。');
    }
    form.reset(values);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 pb-24'>
        <Card className='bg-card/50'>
          <CardContent>
            <FieldGroup>
              <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                <FieldContent>
                  <ControlledFieldLabel>AutoMod Plusを有効にする</ControlledFieldLabel>
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
                  <CardTitle>フィルター</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup className='gap-3'>
                    <Card>
                      <CardContent>
                        <FieldGroup>
                          <ControlledField
                            control={form.control}
                            name='enableInviteUrlFilter'
                            orientation='horizontal'
                            disabled={!enabled}
                          >
                            <FieldContent>
                              <ControlledFieldLabel>
                                このサーバー以外の招待リンク
                              </ControlledFieldLabel>
                              <FieldDescription>
                                送信先のサーバー以外のDiscordサーバーの招待リンクを含むメッセージを削除します。
                              </FieldDescription>
                              <ControlledFieldError />
                            </FieldContent>
                            <ControlledSwitch />
                          </ControlledField>
                        </FieldGroup>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent>
                        <FieldGroup>
                          <ControlledField
                            control={form.control}
                            name='enableTokenFilter'
                            orientation='horizontal'
                            disabled={!enabled}
                          >
                            <FieldContent>
                              <ControlledFieldLabel>Discordトークン</ControlledFieldLabel>
                              <FieldDescription>
                                Discordアカウントのトークンを含むメッセージを削除します。
                              </FieldDescription>
                              <ControlledFieldError />
                            </FieldContent>
                            <ControlledSwitch />
                          </ControlledField>
                        </FieldGroup>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent>
                        <FieldGroup>
                          <ControlledField
                            control={form.control}
                            name='enableDomainFilter'
                            orientation='horizontal'
                            disabled={!enabled}
                          >
                            <FieldContent>
                              <ControlledFieldLabel>ドメイン</ControlledFieldLabel>
                              <FieldDescription>
                                指定したドメインのリンクを含むメッセージを削除します。
                              </FieldDescription>
                              <ControlledFieldError />
                            </FieldContent>
                            <ControlledSwitch />
                          </ControlledField>
                          <FieldSeparator />
                          <Watch
                            control={form.control}
                            name='enableDomainFilter'
                            render={(enableDomainFilter) => (
                              <ControlledField
                                control={form.control}
                                name='domainList'
                                orientation='responsive'
                                disabled={!enabled || !enableDomainFilter}
                              >
                                <FieldContent>
                                  <ControlledFieldLabel>ブロックするドメイン</ControlledFieldLabel>
                                  <FieldDescription>
                                    カンマまたは改行で区切って入力してください。
                                    ドメインのブロックは、設定したドメインのサブドメインも対象になります。
                                  </FieldDescription>
                                  <ControlledFieldError />
                                </FieldContent>
                                <div className='flex flex-col gap-1.5 sm:min-w-sm sm:max-w-sm'>
                                  <ControlledTextarea placeholder='example.com' rows={4} />
                                  <Watch
                                    control={form.control}
                                    name='domainList'
                                    render={(value) => (
                                      <span className='self-end text-muted-foreground text-xs'>
                                        {parseDomainList(value).length}/{MaxDomains}
                                      </span>
                                    )}
                                  />
                                </div>
                              </ControlledField>
                            )}
                          />
                        </FieldGroup>
                      </CardContent>
                    </Card>
                  </FieldGroup>
                </CardContent>
              </Card>
              <Card className='bg-card/50'>
                <CardHeader>
                  <CardTitle>例外設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Alert variant='info'>
                      <CircleAlertIcon />
                      <AlertDescription>
                        Botや「サーバーを管理」権限を持っているメンバーは、この設定にかかわらず全てのフィルターが適用されません。
                      </AlertDescription>
                    </Alert>
                    <ControlledField
                      control={form.control}
                      name='ignoreChannels'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>除外するチャンネル</ControlledFieldLabel>
                        <FieldDescription>
                          この設定はチャンネルのスレッドにも適用されます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledChannelSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        items={channels}
                        excludeTypes={[ChannelType.GuildCategory]}
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
                        <ControlledFieldLabel>除外するロール</ControlledFieldLabel>
                        <FieldDescription>
                          設定したロールが付与されているユーザーはフィルターが適用されなくなります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledRoleSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        items={roles}
                        disabledItemFilter={(role) => role.id === guildId}
                        multiple
                      />
                    </ControlledField>
                  </FieldGroup>
                </CardContent>
              </Card>
              <Card className='bg-card/50'>
                <CardHeader>
                  <CardTitle>ログ設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <ControlledField
                      control={form.control}
                      name='enableLog'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>ログを有効にする</ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、メッセージがブロックされた際にログを送信するようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
                    <FieldSeparator />
                    <Watch
                      control={form.control}
                      name='enableLog'
                      render={(enableLog) => (
                        <ControlledField
                          control={form.control}
                          name='logChannel'
                          orientation='responsive'
                          align='center'
                          disabled={!enabled || !enableLog}
                        >
                          <FieldContent>
                            <ControlledFieldLabel>ログを送信するチャンネル</ControlledFieldLabel>
                            <ControlledFieldError />
                          </FieldContent>
                          <ControlledChannelSelect
                            items={channels}
                            includeTypes={[ChannelType.GuildText]}
                            className='sm:min-w-xs'
                          />
                        </ControlledField>
                      )}
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
            </>
          )}
        />
        <FormDevTool />
        <FormChangePublisher />
      </form>
    </FormProvider>
  );
}
