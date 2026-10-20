'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel, InternalApiRole } from '@repo/shared';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import { useParams } from 'next/navigation';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { Badge } from '@/components/reui/badge';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { hasPermission } from '@/lib/discord/utils';
import { updateSettingAction } from './action';
import { formSchema } from './schema';

const publishPermission =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.ManageMessages;

type FormProps = {
  channels: InternalApiChannel[];
  roles: InternalApiRole[];
  defaultValues?: z.infer<typeof formSchema>;
};

export function SettingForm({ channels, roles, defaultValues }: FormProps) {
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
        <Card className='bg-card/50'>
          <CardContent>
            <FieldGroup>
              <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                <FieldContent>
                  <ControlledFieldLabel>自動アナウンス公開を有効にする</ControlledFieldLabel>
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
                  <CardTitle>チャンネル設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <ControlledField
                      control={form.control}
                      name='channels'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>自動公開するチャンネル</ControlledFieldLabel>
                        <FieldDescription>
                          アナウンスチャンネルを最大20個まで選択できます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledChannelSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        items={channels}
                        includeTypes={[ChannelType.GuildAnnouncement]}
                        disabledItemFilter={(channel) =>
                          !hasPermission(channel.bot_permissions, publishPermission)
                        }
                        multiple
                      />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='reactOnFailure'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          公開失敗時にリアクションを付ける<Badge>New</Badge>
                        </ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、メッセージの公開に失敗した際、メッセージにリアクションを付けるようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
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
                      name='ignoreRoles'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          アナウンス公開を除外するロール<Badge>New</Badge>
                        </ControlledFieldLabel>
                        <FieldDescription>
                          選択したロールを持つメンバーが送信するメッセージは、自動公開の対象から除外されます。
                          最大20個まで選択できます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledRoleSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        items={roles.filter((role) => role.id !== guildId)}
                        multiple
                      />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='ignoreWebhooks'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          Webhookが送信したメッセージを自動公開しない<Badge>New</Badge>
                        </ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、Webhookによる投稿を自動公開の対象から除外します。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
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
