import { ComponentType } from 'discord-api-types/v10';
import { AtSignIcon, type LucideIcon, MessageSquareReplyIcon, SparklesIcon } from 'lucide-react';
import type { Steps } from './steps-editor';

type Template = {
  icon?: LucideIcon;
  label: string;
  description?: string;
  needsRoleRules?: boolean;
  steps: Steps;
};

const templates = {
  blank: {
    icon: SparklesIcon,
    label: 'オリジナルのアクション',
    steps: [],
  },
  'role-toggle': {
    icon: AtSignIcon,
    label: 'ロール付与',
    needsRoleRules: true,
    description: 'ボタンを押した人に指定したロールを付与・解除し、結果を返信します。',
    steps: [
      // ロールは編集ページで選ぶ(未設定のままでは保存できない)
      { type: 'role-toggle', config: { roleId: '' } },
      {
        type: 'reply-message',
        config: {
          components: [
            {
              type: ComponentType.TextDisplay,
              content: '{{roleToggleRole}} を{{roleToggleResult}}しました。',
            },
          ],
          ephemeral: true,
        },
      },
    ],
  },
  'reply-message': {
    icon: MessageSquareReplyIcon,
    label: 'メッセージ返信',
    description: 'ボタンを押した人にしか表示されないメッセージを返信します。',
    steps: [
      {
        type: 'reply-message',
        config: {
          components: [
            {
              type: ComponentType.TextDisplay,
              content: 'ボタンが押されました！',
            },
          ],
          ephemeral: true,
        },
      },
    ],
  },
} satisfies Record<string, Template>;

export type CustomActionTemplate = keyof typeof templates;
export const customActionTemplates: Record<CustomActionTemplate, Template> = templates;

export const isCustomActionTemplate = (v: unknown): v is CustomActionTemplate =>
  typeof v === 'string' && v in customActionTemplates;
