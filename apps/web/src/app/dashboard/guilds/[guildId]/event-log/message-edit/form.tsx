'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type APIGuildChannel,
  type APIRole,
  ChannelType,
  type GuildChannelType,
} from 'discord-api-types/v10';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { FormProvider, type UseFormReturn, useForm, useFormState, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { updateSettingAction } from './action';
import { formSchema } from './schema';

type FormProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  roles: APIRole[];
  defaultValues?: z.infer<typeof formSchema>;
  onFormReady?: (
    methods: UseFormReturn<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>,
  ) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function SettingForm({
  channels,
  roles,
  defaultValues,
  onFormReady,
  onDirtyChange,
}: FormProps) {
  const { guildId }: { guildId: string } = useParams();
  const bindUpdateSettingAction = updateSettingAction.bind(null, guildId);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const { isDirty } = useFormState({ control: form.control });

  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await bindUpdateSettingAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error('設定の更新中に問題が発生しました。時間をおいて再度お試しください。');
    }
    form.reset(values);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <ControlledField control={form.control} name='enabled' orientation='horizontal'>
            <FieldContent>
              <ControlledFieldLabel>メッセージ編集ログを有効にする</ControlledFieldLabel>
              <FieldDescription>メッセージが編集された際にログを送信します。</FieldDescription>
              <ControlledFieldError />
            </FieldContent>
            <ControlledSwitch />
          </ControlledField>
          <FieldSeparator />
          <Watch
            control={form.control}
            name='enabled'
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
                    <ControlledFieldLabel>ログを送信するチャンネル</ControlledFieldLabel>
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
                  name='ignoreRoles'
                  orientation='responsive'
                  disabled={!enabled}
                >
                  <FieldContent>
                    <ControlledFieldLabel>ログの対象外にするロール</ControlledFieldLabel>
                    <FieldDescription>
                      選択したロールを持つメンバーが行うメッセージ編集のログは送信されません。最大10個まで選択できます。
                    </FieldDescription>
                    <ControlledFieldError />
                  </FieldContent>
                  <ControlledRoleSelect
                    items={roles}
                    multiple
                    className='sm:min-w-sm sm:max-w-sm'
                  />
                </ControlledField>
              </>
            )}
          />
        </FieldGroup>
        <FormDevTool />
        <FormChangePublisher />
      </form>
    </FormProvider>
  );
}
