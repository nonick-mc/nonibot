'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type APIGuildChannel,
  type APIGuildForumChannel,
  type APIRole,
  ChannelType,
  type GuildChannelType,
} from 'discord-api-types/v10';
import {
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
  WrenchIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import {
  FieldArray,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
  Watch,
} from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Badge } from '@/components/reui/badge';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/reui/sortable';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  ControlledFieldProvider,
} from '@/components/rhf/field';
import { ControlledForumTagSelect } from '@/components/rhf/forum-tag-select';
import { ControlledInput } from '@/components/rhf/input';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { updateSettingAction } from './action';
import { formSchema } from './schema';

type FormProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  roles: APIRole[];
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
                  <ControlledFieldLabel>サーバー内通報を有効にする</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>チャンネル設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Watch
                control={form.control}
                name='enabled'
                render={(enabled) => (
                  <ControlledField
                    control={form.control}
                    name='channel'
                    orientation='responsive'
                    align='center'
                    disabled={!enabled}
                  >
                    <FieldContent>
                      <ControlledFieldLabel>通報を管理するチャンネル</ControlledFieldLabel>
                      <FieldDescription>
                        テキストチャンネル または フォーラムチャンネルを指定できます。
                      </FieldDescription>
                      <ControlledFieldError />
                    </FieldContent>
                    <ControlledChannelSelect
                      items={channels}
                      includeTypes={[ChannelType.GuildText, ChannelType.GuildForum]}
                    />
                  </ControlledField>
                )}
              />
              <ForumTagSettingFields channels={channels} />
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
                    <Alert variant='warning'>
                      <TriangleAlertIcon />
                      <AlertTitle>「モデレーターも通報の対象にする」設定は削除されます</AlertTitle>
                      <AlertDescription>
                        この設定は将来のバージョンで「通報の対象外にするロール」設定に統一されます。
                      </AlertDescription>
                    </Alert>
                    <ControlledField
                      control={form.control}
                      name='includeModerator'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>モデレーターも通報の対象にする</ControlledFieldLabel>
                        <FieldDescription>
                          有効にすると、「メンバー管理」権限を持つユーザーをメンバーが通報できるようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='showModerateLog'
                      orientation='horizontal'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>モデレートログを有効にする</ControlledFieldLabel>
                        <FieldDescription>
                          報告されたメッセージやユーザーに関連するモデレートを行った際、スレッドにログが送信されるようになります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='ignoreRoles'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>
                          通報の対象外にするロール<Badge>New</Badge>
                        </ControlledFieldLabel>
                        <FieldDescription>
                          通報の対象外にするロールを最大10個まで選択できます。管理者権限を持つメンバーは、この設定に関わらず常に対象外になります。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledRoleSelect items={roles} multiple />
                    </ControlledField>
                    <FieldSeparator />
                    <ControlledField
                      control={form.control}
                      name='mentionRoles'
                      orientation='responsive'
                      disabled={!enabled}
                    >
                      <FieldContent>
                        <ControlledFieldLabel>メンションするロール</ControlledFieldLabel>
                        <FieldDescription>
                          通報が送られた際にメンションするロールを最大10個まで選択できます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledRoleSelect items={roles} multiple />
                    </ControlledField>
                  </>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>フォーム設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Watch
                control={form.control}
                name='enabled'
                render={(enabled) => (
                  <Field orientation='responsive' data-disabled={!enabled}>
                    <FieldContent>
                      <ControlledFieldProvider control={form.control} name='categories'>
                        <ControlledFieldLabel>
                          通報カテゴリ
                          <Badge>New</Badge>
                        </ControlledFieldLabel>
                        <FieldDescription>
                          通報時に選択できるカテゴリを設定します。カテゴリが設定されていない場合、代わりに通報理由を記入する入力欄が表示されます。
                        </FieldDescription>
                        <ControlledFieldError />
                      </ControlledFieldProvider>
                    </FieldContent>
                    <FieldArray
                      control={form.control}
                      name='categories'
                      keyName='fieldId'
                      render={({ fields, move, append, remove }) => (
                        <div className='flex-1 flex flex-col gap-3'>
                          {fields.length ? (
                            <Sortable
                              className='flex flex-col gap-2'
                              value={fields.map((field) => ({ id: field.id! }))}
                              onValueChange={() => {}}
                              getItemValue={(item) => item.id}
                              onMove={({ activeIndex, overIndex }) => move(activeIndex, overIndex)}
                              strategy='vertical'
                            >
                              {fields.map((field, index) => (
                                <SortableItem
                                  key={field.id}
                                  value={field.id!}
                                  className='flex items-center gap-2'
                                  disabled={!enabled}
                                >
                                  <SortableItemHandle>
                                    <GripVerticalIcon className='size-4 text-muted-foreground' />
                                  </SortableItemHandle>
                                  <ControlledField
                                    control={form.control}
                                    name={`categories.${index}.label`}
                                    className='gap-1'
                                    disabled={!enabled}
                                  >
                                    <ControlledInput placeholder='カテゴリ名' />
                                    <ControlledFieldError />
                                  </ControlledField>
                                  <Button
                                    onClick={() => remove(index)}
                                    size='icon-sm'
                                    variant='ghost'
                                    disabled={!enabled}
                                  >
                                    <Trash2Icon className='text-destructive' />
                                  </Button>
                                </SortableItem>
                              ))}
                            </Sortable>
                          ) : (
                            <Empty
                              className={cn('border border-dashed', { 'opacity-50': !enabled })}
                            >
                              <EmptyHeader>
                                <EmptyMedia variant='icon'>
                                  <WrenchIcon />
                                </EmptyMedia>
                                <EmptyTitle>カテゴリが未設定です</EmptyTitle>
                              </EmptyHeader>
                            </Empty>
                          )}
                          <Button
                            className='w-full text-foreground!'
                            variant='outline'
                            onClick={() => append({ id: crypto.randomUUID(), label: '' })}
                            disabled={fields.length >= 10 || !enabled}
                          >
                            <PlusIcon />
                            カテゴリを追加
                          </Button>
                        </div>
                      )}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
        <FormDevTool />
        <FormChangePublisher />
      </form>
    </FormProvider>
  );
}

function ForumTagSettingFields({ channels }: { channels: APIGuildChannel<GuildChannelType>[] }) {
  const form = useFormContext<z.infer<typeof formSchema>>();
  const channelId = useWatch({ control: form.control, name: 'channel' });
  const enabled = useWatch({ control: form.control, name: 'enabled' });

  // biome-ignore lint/correctness/useExhaustiveDependencies: チャンネルが変更された際にタグの選択を解除 (初回レンダリングでタグの選択が解除されないように、isDirtyがtrueの場合のみ有効)
  useEffect(() => {
    if (form.formState.isDirty) {
      form.setValue('forumCompletedTag', null);
      form.setValue('forumIgnoredTag', null);
    }
  }, [channelId]);

  const selectedChannel = channels.find((ch) => ch.id === channelId);
  if (selectedChannel?.type !== ChannelType.GuildForum) return null;

  const tags = (selectedChannel as APIGuildForumChannel).available_tags;

  return (
    <>
      <FieldSeparator />
      <ControlledField
        control={form.control}
        name='forumCompletedTag'
        orientation='responsive'
        align='center'
        disabled={!enabled}
      >
        <FieldContent>
          <ControlledFieldLabel>「対応済み」ボタンを押した時に付与するタグ</ControlledFieldLabel>
          <ControlledFieldError />
        </FieldContent>
        <ControlledForumTagSelect items={tags} />
      </ControlledField>
      <FieldSeparator />
      <ControlledField
        control={form.control}
        name='forumIgnoredTag'
        orientation='responsive'
        align='center'
        disabled={!enabled}
      >
        <FieldContent>
          <ControlledFieldLabel>「対応なし」ボタンを押した時に付与するタグ</ControlledFieldLabel>
          <ControlledFieldError />
        </FieldContent>
        <ControlledForumTagSelect items={tags} />
      </ControlledField>
    </>
  );
}
