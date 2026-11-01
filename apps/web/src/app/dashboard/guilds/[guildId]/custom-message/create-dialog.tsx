'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { InternalApiChannel } from '@repo/shared/types';
import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire';
import { cn } from 'cn';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import { PencilIcon, SendIcon, TriangleAlertIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { type ComponentProps, type MouseEvent, useState } from 'react';
import { FormProvider, useForm, useWatch, Watch } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { DiscordMessage } from '@/components/discord/preview/message';
import type { MessageResources } from '@/components/discord/resources';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { ControlledButton } from '@/components/rhf/button';
import { ControlledChannelSelect } from '@/components/rhf/channel-select';
import { ControlledComponentsV2EditorDialog } from '@/components/rhf/components-v2-editor-dialog';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledInput } from '@/components/rhf/input';
import { ControlledSwitch } from '@/components/rhf/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';
import { Spinner } from '@/components/ui/spinner';
import { uniqueName } from '@/lib/unique-name';
import { sendMessageAction } from './action';
import { createFormSchema } from './schema';

const defaultSaveName = '無題のメッセージ';

const steps = ['channel', 'content', 'save'] as const;
type Step = (typeof steps)[number];

type CreateDialogProps = {
  children: ComponentProps<typeof DialogTrigger>['render'];
  channels: InternalApiChannel[];
  isFull: boolean;
  names: string[];
} & Pick<MessageResources, 'emojis' | 'roles' | 'allowedComponents'>;

export function CreateDialog({ children, ...props }: CreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className='max-h-[95vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>メッセージを作成</DialogTitle>
        </DialogHeader>
        <CreateForm {...props} onSent={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * 質問の回答として扱われる入力欄。Questionnaire標準の入力欄ではない質問を「回答済み」にするために使う。
 */
function AnswerMarker({ filled }: { filled: boolean }) {
  return (
    <QuestionnairePrimitive.Input
      className='sr-only'
      tabIndex={-1}
      aria-hidden
      readOnly
      value={filled ? '1' : ''}
    />
  );
}

function CreateForm({
  channels,
  emojis,
  roles,
  allowedComponents,
  isFull,
  names,
  onSent,
}: Omit<CreateDialogProps, 'children'> & { onSent: () => void }) {
  const { guildId } = useParams<{ guildId: string }>();
  const resources = { emojis, roles, channels, allowedComponents };
  const [step, setStep] = useState<Step>('channel');
  const [direction, setDirection] = useState<1 | -1 | 0>(0);
  const itemMotion =
    direction === 0
      ? undefined
      : cn(
          'data-active:animate-in data-active:fade-in-0 data-active:duration-300',
          direction === 1
            ? 'data-active:slide-in-from-right-8'
            : 'data-active:slide-in-from-left-8',
        );

  const form = useForm({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      channelId: '',
      components: [],
      save: !isFull,
      name: uniqueName(defaultSaveName, names),
    },
  });
  const { isSubmitting } = form.formState;
  const channelId = useWatch({ control: form.control, name: 'channelId' });
  const components = useWatch({ control: form.control, name: 'components' });

  function goTo(next: Step) {
    setDirection(steps.indexOf(next) > steps.indexOf(step) ? 1 : -1);
    setStep(next);
  }

  // 次の質問へ進む前に、現在の質問の回答を検証する
  async function onNext(e: MouseEvent) {
    e.preventDefault();
    const valid = await form.trigger(step === 'channel' ? 'channelId' : 'components');
    if (valid) goTo(steps[steps.indexOf(step) + 1]);
  }

  async function onSubmit({ channelId, components, save, name }: z.infer<typeof createFormSchema>) {
    const res = await sendMessageAction.bind(
      null,
      guildId,
    )({
      channelId,
      components,
      name: !isFull && save ? name || uniqueName(defaultSaveName, names) : undefined,
    });
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? 'メッセージの送信中に問題が発生しました。');
    }
    toast.success('メッセージを送信しました。');
    onSent();
  }

  return (
    <FormProvider {...form}>
      <Questionnaire
        item={step}
        onItemChange={(item) => goTo(item as Step)}
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          goTo(errors.channelId ? 'channel' : 'content');
        })}
      >
        <QuestionnaireItem name='channel' required className={itemMotion}>
          <QuestionnaireTitle>送信先のチャンネルを選択してください</QuestionnaireTitle>
          <QuestionnaireDescription>
            nonibotが「メッセージを送信」権限を持っているテキストチャンネルを選択できます。
          </QuestionnaireDescription>
          <ControlledField control={form.control} name='channelId'>
            <ControlledChannelSelect
              items={channels}
              includeTypes={[ChannelType.GuildText, ChannelType.GuildAnnouncement]}
              requirePermissions={[PermissionFlagsBits.SendMessages]}
            />
            <ControlledFieldError />
          </ControlledField>
          <AnswerMarker filled={!!channelId} />
          <QuestionnaireError>チャンネルを選択してください。</QuestionnaireError>
        </QuestionnaireItem>
        <QuestionnaireItem name='content' required className={itemMotion}>
          <QuestionnaireTitle>送信するメッセージを設定してください</QuestionnaireTitle>
          <ControlledField control={form.control} name='components'>
            <Watch
              control={form.control}
              name='components'
              render={(components) => (
                <DiscordMessage
                  components={components ?? []}
                  resources={resources}
                  className='max-h-100'
                />
              )}
            />
            <ControlledComponentsV2EditorDialog resources={resources}>
              <ControlledButton variant='outline' className='w-full'>
                <PencilIcon />
                メッセージを編集
              </ControlledButton>
            </ControlledComponentsV2EditorDialog>
            <ControlledFieldError />
          </ControlledField>
          <AnswerMarker filled={components.length > 0} />
          <QuestionnaireError>メッセージの内容を入力してください。</QuestionnaireError>
        </QuestionnaireItem>
        <QuestionnaireItem name='save' required className={itemMotion}>
          <QuestionnaireTitle>メッセージを保存しますか？</QuestionnaireTitle>
          <FieldGroup className='my-3 gap-5'>
            <ControlledField control={form.control} name='save' orientation='horizontal'>
              <FieldContent>
                <ControlledFieldLabel>メッセージを保存する</ControlledFieldLabel>
                <FieldDescription>
                  保存したメッセージはカスタムメッセージ一覧に表示され、後から編集することができます。
                </FieldDescription>
              </FieldContent>
              <ControlledSwitch />
            </ControlledField>
            <Watch
              control={form.control}
              name='save'
              render={(save) =>
                save && (
                  <>
                    <FieldSeparator />
                    <ControlledField control={form.control} name='name'>
                      <FieldContent>
                        <ControlledFieldLabel>メッセージの名前</ControlledFieldLabel>
                        <ControlledFieldError />
                      </FieldContent>
                      <ControlledInput maxLength={50} placeholder={defaultSaveName} />
                    </ControlledField>
                  </>
                )
              }
            />
            {isFull && (
              <Alert variant='warning'>
                <TriangleAlertIcon />
                <AlertTitle>保存できるメッセージが上限に達しています</AlertTitle>
                <AlertDescription>
                  このメッセージは送信されますが、保存されません。
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <AnswerMarker filled />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious>戻る</QuestionnairePrevious>
          <QuestionnaireNext onClick={onNext}>次へ</QuestionnaireNext>
          <QuestionnaireSubmit disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : <SendIcon />}
            送信
          </QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
    </FormProvider>
  );
}
