'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared/types';
import { Trash2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ComponentsV2EditorPanel } from '@/components/discord/components-v2-editor/panel';
import type { MessageResources } from '@/components/discord/resources';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
  ControlledFieldProvider,
} from '@/components/rhf/field';
import { ControlledInput } from '@/components/rhf/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldGroup } from '@/components/ui/field';
import { updateCustomMessage } from '../action';
import { DeleteDialog } from '../delete-dialog';
import type { editorFormSchema } from '../schema';
import { updateFormSchema } from '../schema';

type FormProps = {
  message: {
    id: string;
    name: string;
    components: z.input<typeof editorFormSchema>['components'];
  };
  channels: InternalApiChannel[];
} & Pick<MessageResources, 'emojis' | 'roles' | 'allowedComponents'>;

const formSchema = updateFormSchema.omit({ id: true });

export function SettingForm({ message, channels, emojis, roles, allowedComponents }: FormProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const resources = { emojis, roles, channels, allowedComponents };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: message.name, components: message.components },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await updateCustomMessage.bind(null, guildId)({ id: message.id, ...values });
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? 'メッセージの更新中に問題が発生しました。');
    }
    toast.success('メッセージを更新しました。');
    form.reset(values);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 pb-24'>
        <Card className='bg-card/50'>
          <CardContent>
            <FieldGroup>
              <ControlledField
                control={form.control}
                name='name'
                orientation='responsive'
                align='center'
              >
                <FieldContent>
                  <ControlledFieldLabel>メッセージの名前</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledInput
                  className='sm:min-w-xs'
                  maxLength={50}
                  placeholder='メッセージの名前を入力'
                />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>メッセージ</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 h-[70vh] min-h-96'>
            <ControlledFieldProvider control={form.control} name='components'>
              <ControlledFieldError />
            </ControlledFieldProvider>
            <ComponentsV2EditorPanel
              resources={resources}
              footer={(addMenu) => <div className='flex'>{addMenu}</div>}
            />
          </CardContent>
        </Card>
        <FormDevTool />
        <FormChangePublisher />
        <DeleteDialog id={message.id} name={message.name}>
          <Button type='button' className='w-fit' variant='destructive'>
            <Trash2Icon />
            メッセージを削除
          </Button>
        </DeleteDialog>
      </form>
    </FormProvider>
  );
}
