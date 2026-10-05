'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { autoCreateThreadRule } from '@repo/database';
import type { APIRole } from 'discord-api-types/v10';
import type { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, SaveIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { FormDevTool } from '@/components/form';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldContent, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { updateRuleAction } from '../action';
import { RuleFormFields } from '../form';
import { updateRuleFormSchema } from '../schema';

type UpdateRuleDialogProps = {
  targetChannelName: string;
  roles: APIRole[];
  rule: InferSelectModel<typeof autoCreateThreadRule>;
  disabled?: boolean;
};

export function UpdateRuleDialog({
  targetChannelName,
  roles,
  rule,
  disabled,
}: UpdateRuleDialogProps) {
  const bindUpdateRuleAction = updateRuleAction.bind(null, rule.guildId, rule.channelId);
  const [open, onOpenChange] = useState(false);

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

  const enabled = useWatch({ control: form.control, name: 'enabled' });

  async function onSubmit(values: z.infer<typeof updateRuleFormSchema>) {
    const res = await bindUpdateRuleAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error('設定の更新中に問題が発生しました。時間をおいて再度お試しください。');
    }
    onOpenChange(false);
  }

  useEffect(() => {
    if (!open) {
      form.reset(rule);
    }
  }, [open, form, rule]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant='outline' size='icon' disabled={disabled}>
            <PencilIcon />
          </Button>
        }
      />
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>「#{targetChannelName}」の設定</DialogTitle>
              <DialogDescription>自動スレッド作成の動作を変更します。</DialogDescription>
            </DialogHeader>
            <div className='py-8 flex flex-col gap-6'>
              <Card>
                <CardContent>
                  <FieldGroup>
                    <ControlledField control={form.control} name='enabled' orientation='horizontal'>
                      <FieldContent>
                        <ControlledFieldLabel>
                          「#{targetChannelName}」で自動スレッド作成を有効にする
                        </ControlledFieldLabel>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledSwitch />
                    </ControlledField>
                  </FieldGroup>
                </CardContent>
              </Card>
              {/* biome-ignore lint/suspicious/noExplicitAny: 作成/更新フォームで型の異なるControlを共有するため */}
              <RuleFormFields control={form.control as any} roles={roles} disabled={!enabled} />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type='submit'
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
              >
                {form.formState.isSubmitting ? <Spinner /> : <SaveIcon />}
                保存
              </Button>
            </DialogFooter>
          </form>
          <FormDevTool />
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
