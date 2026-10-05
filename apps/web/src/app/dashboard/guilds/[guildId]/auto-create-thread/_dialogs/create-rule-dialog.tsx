'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { autoCreateThreadRule } from '@repo/database';
import {
  type APIGuildChannel,
  type APIRole,
  ChannelType,
  type GuildChannelType,
  ThreadAutoArchiveDuration,
} from 'discord-api-types/v10';
import type { InferSelectModel } from 'drizzle-orm';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { FormDevTool } from '@/components/form';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
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
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { createRuleAction } from '../action';
import { RulesMaxSize } from '../constants';
import { RuleFormFields } from '../form';
import { createRuleFormSchema } from '../schema';

type CreateRuleDialogProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  roles: APIRole[];
  rules: InferSelectModel<typeof autoCreateThreadRule>[];
};

export function CreateRuleDialog({ channels, roles, rules }: CreateRuleDialogProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const bindCreateRuleAction = createRuleAction.bind(null, guildId);
  const [open, onOpenChange] = useState(false);

  const form = useForm({
    resolver: zodResolver(createRuleFormSchema),
    defaultValues: {
      channelId: '',
      threadName: '{{userDisplayName}}のスレッド',
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      initialThreadState: 'open',
      ignoreBot: true,
      ignoreRoles: [],
    },
  });

  async function onSubmit(values: z.infer<typeof createRuleFormSchema>) {
    const res = await bindCreateRuleAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error(
        'チャンネルの追加中に問題が発生しました。時間をおいて再度お試しください。',
      );
    }
    onOpenChange(false);
    toast.success('チャンネルを追加しました。');
  }

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button disabled={rules.length >= RulesMaxSize}>
            <PlusIcon />
            チャンネルを追加
          </Button>
        }
      />
      <DialogContent className='max-h-[90vh] overflow-y-scroll scroll-fade-y no-scrollbar'>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>チャンネルを追加</DialogTitle>
              <DialogDescription>
                自動スレッド作成を適用するチャンネルを追加します。
              </DialogDescription>
            </DialogHeader>
            <div className='py-8 flex flex-col gap-6'>
              <Card>
                <CardContent>
                  <FieldGroup>
                    <ControlledField control={form.control} name='channelId'>
                      <ControlledFieldLabel>スレッドを作成するチャンネル</ControlledFieldLabel>
                      <ControlledChannelSelect
                        items={channels}
                        includeTypes={[ChannelType.GuildText]}
                        disabledItemFilter={(channel) =>
                          rules.some((rule) => rule.channelId === channel.id)
                        }
                      />
                      <ControlledFieldError />
                    </ControlledField>
                  </FieldGroup>
                </CardContent>
              </Card>
              {/* biome-ignore lint/suspicious/noExplicitAny: 作成/更新フォームで型の異なるControlを共有するため */}
              <RuleFormFields control={form.control as any} roles={roles} />
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
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner /> : <CheckIcon />}
                作成
              </Button>
            </DialogFooter>
          </form>
          <FormDevTool />
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
