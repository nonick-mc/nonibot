'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AssignableRoleRules } from '@repo/shared';
import type { InternalApiRole } from '@repo/shared/types';
import { Trash2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import type { MessageResources } from '@/components/discord/resources';
import { FormChangePublisher, FormDevTool } from '@/components/form';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledInput } from '@/components/rhf/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { updateCustomAction } from '../action';
import { DeleteDialog } from '../delete-dialog';
import { updateFormSchema } from '../schema';
import { type Steps, StepsEditor } from '../steps-editor';

type ActionFormProps = {
  action: { id: string; name: string; steps: Steps };
  roles: InternalApiRole[];
  assignableRoleRules: AssignableRoleRules | null;
  usageCount: number;
  resources: MessageResources;
};

const formSchema = updateFormSchema.omit({ id: true });

export function SettingForm({
  action,
  roles,
  assignableRoleRules,
  usageCount,
  resources,
}: ActionFormProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const defaultValues = { name: action.name, steps: action.steps };

  const form = useForm({ resolver: zodResolver(formSchema), defaultValues });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await updateCustomAction.bind(null, guildId)({ id: action.id, ...values });
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? 'アクションの更新中に問題が発生しました。');
    }
    toast.success('アクションを更新しました。');
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
                  <ControlledFieldLabel>アクション名</ControlledFieldLabel>
                  <FieldDescription>
                    他のアクション名と重複しない名前にする必要があります。
                  </FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledInput
                  className='sm:min-w-xs'
                  maxLength={50}
                  placeholder='例：お知らせロールの切り替え'
                />
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className='bg-card/50'>
          <CardHeader>
            <CardTitle>アクション</CardTitle>
          </CardHeader>
          <CardContent>
            <StepsEditor
              roles={roles}
              rules={assignableRoleRules}
              resources={resources}
              originalSteps={action.steps}
              usageCount={usageCount}
            />
          </CardContent>
        </Card>
        <FormDevTool />
        <FormChangePublisher />
        <DeleteDialog id={action.id} name={action.name} usageCount={usageCount}>
          <Button type='button' className='w-fit' variant='destructive'>
            <Trash2Icon />
            アクションを削除
          </Button>
        </DeleteDialog>
      </form>
    </FormProvider>
  );
}
