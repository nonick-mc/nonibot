import { ControlledRadioGroup } from '@/components/rhf/radio-group';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroupItem } from '@/components/ui/radio-group';

const captchaTypeOptions = [
  {
    value: 'web',
    label: 'Web認証',
    description:
      'ユーザーは認証サイトにログインし、Cloudflare Turnstile検証を行うことでロールを取得することができます。',
  },
  {
    value: 'image',
    label: '画像認証',
    description:
      'ユーザーはDMに送信された画像を確認し、画像内の認証コードを入力することでロールを取得することができます。',
  },
  {
    value: 'button',
    label: 'ボタン',
    description: 'ユーザーは認証パネルにあるボタンを押すことでロールを取得することができます。',
  },
];

export function CaptchaTypeRadioGroup() {
  return (
    <ControlledRadioGroup className='sm:flex-1'>
      {captchaTypeOptions.map((option) => (
        <FieldLabel key={option.value} htmlFor={`captchaType-${option.value}`}>
          <Field orientation='horizontal'>
            <RadioGroupItem value={option.value} id={`captchaType-${option.value}`} />
            <FieldContent>
              <FieldTitle>{option.label}</FieldTitle>
              <FieldDescription className='text-xs'>{option.description}</FieldDescription>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </ControlledRadioGroup>
  );
}
