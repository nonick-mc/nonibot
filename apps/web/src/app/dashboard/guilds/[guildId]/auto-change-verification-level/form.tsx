'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared/types';
import { ChannelType, GuildVerificationLevel, PermissionFlagsBits } from 'discord-api-types/v10';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Fragment } from 'react';
import { FormProvider, useForm, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  ControlledFieldProvider,
  useControlledField,
} from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { updateSettingAction } from './action';
import { formSchema } from './schema';

const levels = [
  {
    value: GuildVerificationLevel.Low,
    name: '低',
    description: 'メール認証がされているアカウントのみ',
    color: 'bg-green-500',
  },
  {
    value: GuildVerificationLevel.Medium,
    name: '中',
    description: 'Discordに登録してから5分以上経過したアカウントのみ',
    color: 'bg-yellow-500',
  },
  {
    value: GuildVerificationLevel.High,
    name: '高',
    description: 'このサーバーに参加してから10分以上経過したアカウントのみ',
    color: 'bg-orange-500',
  },
  {
    value: GuildVerificationLevel.VeryHigh,
    name: '最高',
    description: '電話認証がされているアカウントのみ',
    color: 'bg-red-500',
  },
];

function LevelLabel({ level }: { level: (typeof levels)[number] }) {
  return (
    <span className='flex min-w-0 flex-col gap-px text-left'>
      <span className='flex items-center gap-2'>
        <span className={`mt-0.5 size-2 rounded-full ${level.color}`} />
        <span>{level.name}</span>
      </span>
      <span className='whitespace-normal text-muted-foreground text-xs'>{level.description}</span>
    </span>
  );
}

function LevelSelect() {
  return (
    <ControlledSelect>
      <ControlledSelectTrigger className='min-h-16 *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:min-w-0 data-[size=default]:h-auto @md/field-group:max-w-100 @md/field-group:min-w-0 @md/field-group:flex-[1_1_400px]'>
        <SelectValue placeholder='認証レベルを選択'>
          {(value: number) => {
            const level = levels.find((l) => l.value === value);
            return level && <LevelLabel level={level} />;
          }}
        </SelectValue>
      </ControlledSelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {levels.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              <LevelLabel level={level} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </ControlledSelect>
  );
}

function HourInput() {
  const { field } = useControlledField();
  return (
    <InputGroup className='sm:w-28'>
      <ControlledInputGroupInput
        type='number'
        inputMode='numeric'
        min={0}
        max={23}
        step={1}
        value={Number.isNaN(field.value) ? '' : field.value}
        onChange={(e) => field.onChange(e.target.valueAsNumber)}
      />
      <InputGroupAddon align='inline-end'>
        <span className='text-muted-foreground'>:00</span>
      </InputGroupAddon>
    </InputGroup>
  );
}

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
                  <ControlledFieldLabel>自動認証レベル変更を有効にする</ControlledFieldLabel>
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
                    <Field
                      orientation='responsive'
                      data-disabled={!enabled}
                      data-invalid={
                        !!(form.formState.errors.startHour || form.formState.errors.endHour)
                      }
                    >
                      <FieldContent>
                        <FieldLabel>変更を適用する時間帯</FieldLabel>
                        <FieldDescription>
                          認証レベルを変更する時間帯を変更します。
                        </FieldDescription>
                        <FieldError
                          errors={[
                            form.formState.errors.startHour,
                            form.formState.errors.endHour,
                          ].filter((error) => error !== undefined)}
                        />
                      </FieldContent>
                      <div className='flex items-start gap-2'>
                        {(['startHour', 'endHour'] as const).map((name, i) => (
                          <Fragment key={name}>
                            {i === 1 && <span className='py-1.5 text-muted-foreground'>〜</span>}
                            <ControlledFieldProvider
                              control={form.control}
                              name={name}
                              disabled={!enabled}
                            >
                              <HourInput />
                            </ControlledFieldProvider>
                          </Fragment>
                        ))}
                      </div>
                    </Field>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='level'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent className='@md/field-group:min-w-0 @md/field-group:flex-[1_1_400px]'>
                        <ControlledFieldLabel>認証レベル</ControlledFieldLabel>
                        <FieldDescription>
                          期間内に設定する認証レベルを変更します。
                          <br />
                          認証レベルに関する詳しい情報は
                          <Button
                            className='px-0 h-fit'
                            variant='link'
                            nativeButton={false}
                            render={
                              <Link
                                href='https://support.discord.com/hc/ja/articles/216679607'
                                target='_blank'
                              />
                            }
                          >
                            こちら
                          </Button>
                          を参照してください。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <LevelSelect />
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
                          自動変更が開始・終了した際にログを送信します。
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
                          disabled={!enabled || !enableLog}
                        >
                          <FieldContent>
                            <ControlledFieldLabel>ログを送信するチャンネル</ControlledFieldLabel>
                            <ControlledFieldError />
                          </FieldContent>
                          <ControlledChannelSelect
                            items={channels}
                            includeTypes={[ChannelType.GuildText]}
                            requirePermissions={[PermissionFlagsBits.SendMessages]}
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
