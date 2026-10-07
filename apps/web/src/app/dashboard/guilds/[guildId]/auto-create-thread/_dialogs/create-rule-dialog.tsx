'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { autoCreateThreadRule } from '@repo/database';
import { type APIGuildChannel, ChannelType, type GuildChannelType } from 'discord-api-types/v10';
import type { InferSelectModel } from 'drizzle-orm';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, Watch } from 'react-hook-form';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { createRuleAction } from '../action';
import { RulesMaxSize } from '../constants';
import { createRuleFormSchema } from '../schema';

type CreateRuleDialogProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  rules: InferSelectModel<typeof autoCreateThreadRule>[];
};

export function CreateRuleDialog({ channels, rules }: CreateRuleDialogProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const bindCreateRuleAction = createRuleAction.bind(null, guildId);
  const [open, onOpenChange] = useState(false);

  const form = useForm({
    resolver: zodResolver(createRuleFormSchema),
    defaultValues: {
      channelId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof createRuleFormSchema>) {
    const res = await bindCreateRuleAction(values);
    if (res.serverError || res.validationErrors) {
      return toast.error(
        'チャンネルの追加中に問題が発生しました。時間をおいて再度お試しください。',
      );
    }
    router.push(`/dashboard/guilds/${guildId}/auto-create-thread/${values.channelId}`);
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
      <DialogContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>チャンネルを追加</DialogTitle>
            </DialogHeader>
            <FieldGroup className='py-8'>
              <ControlledField control={form.control} name='channelId'>
                <FieldContent>
                  <ControlledFieldLabel>スレッドを作成するチャンネル</ControlledFieldLabel>
                  <FieldDescription>テキストチャンネルである必要があります。</FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledChannelSelect
                  items={channels}
                  includeTypes={[ChannelType.GuildText]}
                  disabledItemFilter={(channel) =>
                    rules.some((rule) => rule.channelId === channel.id)
                  }
                />
              </ControlledField>
            </FieldGroup>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                キャンセル
              </Button>
              <Watch
                control={form.control}
                name='channelId'
                render={(value) => (
                  <Button type='submit' disabled={form.formState.isSubmitting || !value.length}>
                    {form.formState.isSubmitting ? <Spinner /> : <ArrowRightIcon />}
                    次へ
                  </Button>
                )}
              />
            </DialogFooter>
          </form>
          <FormDevTool />
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
