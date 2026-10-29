'use client';

import { cn } from 'cn';
import { useParams, useRouter } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldSeparator } from '@/components/ui/field';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';
import { Spinner } from '@/components/ui/spinner';
import { uniqueName } from '@/lib/unique-name';
import { createCustomAction } from './action';
import { createFormSchema } from './schema';
import { type CustomActionTemplate, customActionTemplates } from './templates';

type CreateDialogProps = {
  children: ComponentProps<typeof DialogTrigger>['render'];
  names: string[];
  canManageRoles: boolean;
};

export function CreateDialog({ children, names, canManageRoles }: CreateDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>アクションを作成</DialogTitle>
        </DialogHeader>
        <CreateForm names={names} canManageRoles={canManageRoles} />
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({
  names,
  canManageRoles,
}: Pick<CreateDialogProps, 'names' | 'canManageRoles'>) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<CustomActionTemplate>('blank');
  const [name, setName] = useState(() => uniqueName(customActionTemplates.blank.label, names));
  const [nameEdited, setNameEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const templateKeys = (Object.keys(customActionTemplates) as CustomActionTemplate[]).filter(
    (key) => key !== 'blank',
  );

  function renderChoice(templateKey: CustomActionTemplate) {
    const t = customActionTemplates[templateKey];
    const disabled = t.needsRoleRules && !canManageRoles;
    return (
      <QuestionnaireChoice
        key={templateKey}
        value={templateKey}
        disabled={disabled}
        defaultChecked={templateKey === template}
        onChange={() => {
          setTemplate(templateKey);
          if (!nameEdited) setName(uniqueName(t.label, names));
        }}
      >
        <span className='flex items-center gap-2 font-medium'>
          {t.icon && <t.icon className='size-4 mt-0.5 text-muted-foreground' />}
          {t.label}
        </span>
        {t.description && (
          <QuestionnaireChoiceDescription>{t.description}</QuestionnaireChoiceDescription>
        )}
        {disabled && (
          <QuestionnaireChoiceDescription className='text-warning'>
            選択するには「ロールの管理」権限が必要です。
          </QuestionnaireChoiceDescription>
        )}
      </QuestionnaireChoice>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = createFormSchema.safeParse({ name });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setIsSubmitting(true);
    const res = await createCustomAction.bind(null, guildId)(parsed.data);
    if (res.serverError || !res.data) {
      setIsSubmitting(false);
      return toast.error(res.serverError ?? 'アクションの作成中に問題が発生しました。');
    }
    toast.success('アクションを作成しました。');

    router.push(`/dashboard/guilds/${guildId}/custom-action/${res.data.id}?template=${template}`);
  }

  return (
    <Questionnaire
      onSubmit={onSubmit}
      onItemChange={(item) => setDirection(item === 'name' ? 1 : -1)}
    >
      <QuestionnaireItem name='template' required className={itemMotion}>
        <QuestionnaireTitle>どのアクションを作りますか?</QuestionnaireTitle>
        <QuestionnaireChoices>
          {renderChoice('blank')}
          <FieldSeparator className='my-2'>テンプレートから始める</FieldSeparator>
          {templateKeys.map(renderChoice)}
        </QuestionnaireChoices>
        <QuestionnaireError>選択してください。</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireItem name='name' required className={itemMotion}>
        <QuestionnaireTitle>アクション名を入力してください</QuestionnaireTitle>
        <QuestionnaireDescription>
          アクション名は後から変更することができます。
        </QuestionnaireDescription>
        <QuestionnaireInput
          maxLength={50}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameEdited(true);
          }}
        />
        <QuestionnaireError>アクション名を入力してください。</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious>戻る</QuestionnairePrevious>
        <QuestionnaireNext>次へ</QuestionnaireNext>
        <QuestionnaireSubmit disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          作成
        </QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  );
}
