'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { verificationMessagePlaceholders } from '@repo/placeholders';
import { verificationActions } from '@repo/shared';
import type { InternalApiChannel } from '@repo/shared/types';
import { CheckCircle2Icon, PencilIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { DiscordMessage } from '@/components/discord/preview/message';
import type { MessageResources } from '@/components/discord/resources';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Badge } from '@/components/reui/badge';
import { ControlledButton } from '@/components/rhf/button';
import { ControlledComponentsV2EditorDialog } from '@/components/rhf/components-v2-editor-dialog';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { updateSettingAction } from './action';
import { CaptchaTypeRadioGroup } from './captcha-type-radio-group';
import { formSchema } from './schema';
import { SendPanelDialog } from './send-panel-dialog';

type FormProps = {
  channels: InternalApiChannel[];
  botHighestRolePosition: number;
  setting?: z.infer<typeof formSchema>;
} & Pick<MessageResources, 'emojis' | 'roles'>;

export function SettingForm({
  channels,
  emojis,
  roles,
  botHighestRolePosition,
  setting,
}: FormProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const isReady = Boolean(setting?.enabled && setting.role);
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
    componentActions: verificationActions,
    placeholders: verificationMessagePlaceholders,
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 pb-24'>
        {isReady && (
          <Alert variant='success'>
            <CheckCircle2Icon />
            <AlertTitle>メンバー認証の準備が整いました！</AlertTitle>
            <AlertDescription>
              認証メッセージを送信して、ユーザーが認証できるようにしましょう。
            </AlertDescription>
            <AlertAction>
              <SendPanelDialog channels={channels} />
            </AlertAction>
          </Alert>
        )}
        <Card className='bg-card/50'>
          <CardContent>
            <FieldGroup>
              <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                <FieldContent>
                  <ControlledFieldLabel>メンバー認証を有効にする</ControlledFieldLabel>
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
                name='enabled'
                render={(enabled) => (
                  <>
                    <ControlledField
                      control={form.control}
                      name='role'
                      orientation='responsive'
                      align='center'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>認証成功時に付与するロール</ControlledFieldLabel>
                        <FieldDescription>
                          nonibotが所持しているロールより低い位置にあるロールを選択できます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledRoleSelect
                        items={roles ?? []}
                        className='sm:min-w-xs'
                        disabledItemFilter={(role) =>
                          role.managed ||
                          role.id === guildId ||
                          role.position > botHighestRolePosition
                        }
                      />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='captchaType'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>認証方法</ControlledFieldLabel>
                        <FieldDescription>
                          ユーザーが認証に使用する方式を変更できます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <CaptchaTypeRadioGroup />
                    </ControlledField>
                  </>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>認証メッセージ</CardTitle>
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
                      <ControlledFieldLabel>
                        メッセージ
                        <Badge>New</Badge>
                      </ControlledFieldLabel>
                      <FieldDescription>
                        ユーザーが認証を行うメッセージをカスタマイズします。
                        <br />
                        メッセージには認証ボタンを設置する必要があります。
                      </FieldDescription>
                      <ControlledFieldError />
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
        <FormChangePublisher />
      </form>
      <FormDevTool />
    </FormProvider>
  );
}
