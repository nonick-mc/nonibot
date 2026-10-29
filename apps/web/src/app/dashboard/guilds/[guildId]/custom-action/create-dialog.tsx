'use client';

import { useParams, useRouter } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import { createCustomAction } from './action';
import { createFormSchema } from './schema';
import { type CustomActionTemplate, customActionTemplates } from './templates';

/** 既に使われている名前と重複しない、`名前 2`のような連番付きの名前を返す */
function uniqueName(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

type CreateDialogProps = {
  children: ComponentProps<typeof DialogTrigger>['render'];
  /** 既存のアクション名(名前の初期値の連番に使う) */
  names: string[];
};

export function CreateDialog({ children, names }: CreateDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>アクションを作成</DialogTitle>
        </DialogHeader>
        <CreateForm names={names} />
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({ names }: Pick<CreateDialogProps, 'names'>) {
  const { guildId } = useParams<{ guildId: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<CustomActionTemplate>('blank');
  const [name, setName] = useState(() => uniqueName(customActionTemplates.blank.label, names));
  const [nameEdited, setNameEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateKeys = (Object.keys(customActionTemplates) as CustomActionTemplate[]).filter(
    (key) => key !== 'blank',
  );

  function renderChoice(templateKey: CustomActionTemplate) {
    const t = customActionTemplates[templateKey];
    return (
      <QuestionnaireChoice
        key={templateKey}
        value={templateKey}
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
    <Questionnaire onSubmit={onSubmit}>
      <QuestionnaireItem name='template' required>
        <QuestionnaireTitle>どのアクションを作りますか?</QuestionnaireTitle>
        <QuestionnaireChoices>
          {renderChoice('blank')}
          <FieldSeparator className='my-2'>テンプレートから始める</FieldSeparator>
          {templateKeys.map(renderChoice)}
        </QuestionnaireChoices>
        <QuestionnaireError>選択してください。</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireItem name='name' required>
        <QuestionnaireTitle>アクション名を入力してください</QuestionnaireTitle>
        <QuestionnaireDescription>
          同じ名前のアクションも作成できます。あとから変更もできます。
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
        <QuestionnaireSubmit disabled={isSubmitting}>作成</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  );
}
