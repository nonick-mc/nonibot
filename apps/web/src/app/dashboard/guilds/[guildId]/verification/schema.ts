import { verificationSetting } from '@repo/database';
import { verificationMessagePlaceholders } from '@repo/placeholders';
import { collectInteractiveComponents, verificationActions } from '@repo/shared';
import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  createMessageUserComponentsSchema,
  type MessageUserComponentsSchema,
  messageComponentsWithDefault,
  SnowflakeRegex,
} from '@/lib/discord/zod';

z.config(z.locales.ja());

const [{ customId: verifyButtonCustomId }] = verificationActions;

export const defaultMessageComponents: z.infer<MessageUserComponentsSchema> = [
  {
    type: ComponentType.Container,
    accent_color: 5763719,
    components: [
      { type: ComponentType.TextDisplay, content: '### 認証' },
      {
        type: ComponentType.TextDisplay,
        content:
          '下の「認証」ボタンを押して認証を行ってください。\n認証が完了すると {{role}} が付与されます。',
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            label: '認証',
            emoji: undefined,
            custom_id: verifyButtonCustomId,
          },
        ],
      },
    ],
  },
];

export const formSchema = createInsertSchema(verificationSetting, {
  enabled: (schema) => schema.default(false),
  role: (schema) => schema.regex(SnowflakeRegex, '無効なIDです。').nullable().default(null),
  captchaType: (schema) => schema.default('web'),
  messageComponents: messageComponentsWithDefault(
    createMessageUserComponentsSchema(verificationMessagePlaceholders, verificationActions),
    defaultMessageComponents,
  ),
})
  .omit({ guildId: true, createdAt: true, updatedAt: true })
  .superRefine((v, ctx) => {
    if (v.enabled && !v.role) {
      ctx.addIssue({
        code: 'custom',
        message: 'ロールが設定されていません。',
        path: ['role'],
      });
    }
    if (
      !collectInteractiveComponents(v.messageComponents).some(
        (c) => c.customId === verifyButtonCustomId,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message: '認証ボタンが設置されていません。',
        path: ['messageComponents'],
      });
    }
  });

export const sendPanelFormSchema = z.object({
  channelId: z.string().regex(SnowflakeRegex, '無効なIDです。'),
});
