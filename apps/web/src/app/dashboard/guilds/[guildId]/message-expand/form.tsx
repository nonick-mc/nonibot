'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared';
import { ChannelType } from 'discord-api-types/v10';
import { MegaphoneIcon, SpoolIcon, Volume2Icon } from 'lucide-react';
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
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { updateSettingAction } from './action';
import { ControlledOptionMultiSelect } from './option-select';
import { formSchema, ignorePrefixes } from './schema';

const IgnoreChannelTypesOptions = [
  { label: 'アナウンスチャンネル', value: ChannelType.GuildAnnouncement, icon: MegaphoneIcon },
  { label: 'ボイスチャンネル', value: ChannelType.GuildVoice, icon: Volume2Icon },
  { label: '公開スレッド', value: ChannelType.PublicThread, icon: SpoolIcon },
  { label: 'プライベートスレッド', value: ChannelType.PrivateThread, icon: SpoolIcon },
] as const;

const IgnorePrefixOptions = ignorePrefixes.map((prefix) => ({ label: prefix, value: prefix }));

type FormProps = {
  channels: InternalApiChannel[];
  defaultValues?: z.infer<typeof formSchema>;
};

export function SettingForm({ channels, defaultValues }: FormProps) {
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
                  <ControlledFieldLabel>メッセージURL展開を有効にする</ControlledFieldLabel>
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
                  <CardTitle>全般設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <ControlledField
                      control={form.control}
                      name='allowExternalGuild'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          このサーバーのメッセージを他のサーバーで展開することを許可する
                        </ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、このサーバーのメッセージURLが他のサーバーでも展開されるようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='onlyOwnGuild'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          このサーバーでは他のサーバーのメッセージを展開しない<Badge>New</Badge>
                        </ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、このサーバーでは、他のサーバーのメッセージURLが送信されても展開されなくなります。
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
                  <CardTitle>例外設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <ControlledField
                      control={form.control}
                      name='ignoreChannelTypes'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>除外するチャンネルの種類</ControlledFieldLabel>
                        <FieldDescription>
                          特定の種類のチャンネルでURLが展開されないようにします。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledOptionMultiSelect
                        className='sm:min-w-sm sm:max-w-sm'
                        options={IgnoreChannelTypesOptions}
                        placeholder='チャンネルの種類を選択'
                        emptyText='チャンネルの種類が見つかりません'
                      />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='ignoreChannels'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>除外するチャンネル</ControlledFieldLabel>
                        <FieldDescription>
                          特定のチャンネルでURLが展開されないようにします。
                          <br />
                          この設定は設定したチャンネルのスレッドにも適用されます。
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
                      name='ignorePrefixes'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>プレフィックス</ControlledFieldLabel>
                        <FieldDescription>
                          URLの前にこれらの記号がある場合に展開が行われないようにします。（5つまで選択可）
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledOptionMultiSelect
                        className='sm:min-w-xs sm:max-w-xs'
                        options={IgnorePrefixOptions}
                        placeholder='プレフィックスを選択'
                        emptyText='プレフィックスが見つかりません'
                      />
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
