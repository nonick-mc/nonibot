'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { autoCreateThreadRule } from '@repo/database';
import { autoThreadPlaceholders } from '@repo/placeholders';
import type { APIRole } from 'discord-api-types/v10';
import type { InferSelectModel } from 'drizzle-orm';
import { Triangle, TriangleAlertIcon } from 'lucide-react';
import { useRef } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { PlaceholderPickerButton } from '@/components/discord/components-v2-editor/placeholder-picker-button';
import { DiscordMessageContext } from '@/components/discord/message-context';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Badge } from '@/components/reui/badge';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { DeleteRuleDialog } from '../_dialogs/delete-rule-dialog';
import { updateRuleAction } from '../action';
import { ArchiveDurationOptions, ThreadStateOptions } from '../constants';
import { updateRuleFormSchema } from '../schema';

type SettingFormProps = {
  targetChannelName: string;
  roles: APIRole[];
  rule: InferSelectModel<typeof autoCreateThreadRule>;
  disabled?: boolean;
};

export function SettingForm({ targetChannelName, roles, rule, disabled }: SettingFormProps) {
  const bindUpdateRuleAction = updateRuleAction.bind(null, rule.guildId, rule.channelId);
  const threadNameRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(updateRuleFormSchema),
    defaultValues: {
      enabled: rule.enabled,
      threadName: rule.threadName,
      autoArchiveDuration: rule.autoArchiveDuration,
      initialThreadState: rule.initialThreadState,
      ignoreBot: rule.ignoreBot,
      ignoreRoles: rule.ignoreRoles,
    },
  });
  const { control } = form;

  const enabled = useWatch({ control, name: 'enabled' });
  const fieldsDisabled = disabled || !enabled;

  async function onSubmit(values: z.infer<typeof updateRuleFormSchema>) {
    const res = await bindUpdateRuleAction(values);
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
              <ControlledField
                control={control}
                name='enabled'
                orientation='horizontal'
                disabled={disabled}
              >
                <FieldContent>
                  <ControlledFieldLabel>自動スレッド作成を有効にする</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <DiscordMessageContext.Provider value={{ placeholders: autoThreadPlaceholders }}>
          <Card className='bg-card/50'>
            <CardHeader>
              <CardTitle>スレッド設定</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <ControlledField
                  control={control}
                  name='threadName'
                  orientation='responsive'
                  disabled={fieldsDisabled}
                >
                  <FieldContent>
                    <ControlledFieldLabel>スレッドの名前</ControlledFieldLabel>
                    <FieldDescription>
                      作成するスレッドの名前をカスタマイズします。
                    </FieldDescription>
                    <ControlledFieldError />
                  </FieldContent>
                  <InputGroup className='sm:min-w-xs'>
                    <ControlledInputGroupInput
                      ref={threadNameRef}
                      placeholder='スレッドの名前を入力'
                    />
                    <InputGroupAddon align='inline-end'>
                      <PlaceholderPickerButton inputRef={threadNameRef} />
                    </InputGroupAddon>
                  </InputGroup>
                </ControlledField>
                <FieldSeparator />
                <ControlledField
                  control={control}
                  name='autoArchiveDuration'
                  orientation='horizontal'
                  disabled={fieldsDisabled}
                >
                  <FieldContent>
                    <ControlledFieldLabel>スレッドの自動アーカイブ時間</ControlledFieldLabel>
                    <FieldDescription>
                      指定した期間アクティブでなかったスレッドはアーカイブされます。
                    </FieldDescription>
                    <ControlledFieldError />
                  </FieldContent>
                  <ControlledSelect>
                    <ControlledSelectTrigger className='sm:min-w-3xs'>
                      <SelectValue placeholder='期間を選択'>
                        {(value: number) =>
                          ArchiveDurationOptions.find((option) => option.value === value)?.label
                        }
                      </SelectValue>
                    </ControlledSelectTrigger>
                    <SelectContent align='end' alignItemWithTrigger={false}>
                      <SelectGroup>
                        {ArchiveDurationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </ControlledSelect>
                </ControlledField>
                <FieldSeparator />
                <ControlledField
                  control={control}
                  name='initialThreadState'
                  orientation='responsive'
                  disabled={fieldsDisabled}
                >
                  <FieldContent>
                    <ControlledFieldLabel>
                      スレッドの初期状態<Badge>New</Badge>
                    </ControlledFieldLabel>
                    <FieldDescription>作成するスレッドの初期状態を変更します。</FieldDescription>
                    <ControlledFieldError />
                  </FieldContent>
                  <ControlledSelect>
                    <ControlledSelectTrigger className='sm:min-w-3xs'>
                      <SelectValue placeholder='状態を選択'>
                        {(value: string) =>
                          ThreadStateOptions.find((option) => option.value === value)?.label
                        }
                      </SelectValue>
                    </ControlledSelectTrigger>
                    <SelectContent align='end' alignItemWithTrigger={false}>
                      <SelectGroup>
                        {ThreadStateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </ControlledSelect>
                </ControlledField>
              </FieldGroup>
            </CardContent>
          </Card>
        </DiscordMessageContext.Provider>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>例外設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <ControlledField
                control={control}
                name='ignoreBot'
                orientation='horizontal'
                disabled={fieldsDisabled}
              >
                <FieldContent>
                  <ControlledFieldLabel>
                    BotやWebhookが送信したメッセージを除外する
                  </ControlledFieldLabel>
                  <FieldDescription>
                    この設定に関わらず、nonibotから送信されたメッセージは常に除外されます。
                  </FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
              <FieldSeparator />
              <ControlledField
                control={control}
                name='ignoreRoles'
                orientation='responsive'
                disabled={fieldsDisabled}
              >
                <FieldContent>
                  <ControlledFieldLabel>スレッド作成を除外するロール</ControlledFieldLabel>
                  <FieldDescription>最大20個まで選択できます。</FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledRoleSelect className='sm:min-w-sm' items={roles} multiple />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <FormDevTool />
        <FormChangePublisher />
        <DeleteRuleDialog targetChannelName={targetChannelName} rule={rule} />
      </form>
    </FormProvider>
  );
}
