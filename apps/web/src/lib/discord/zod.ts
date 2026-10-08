import type { Placeholder } from '@repo/placeholders';
import {
  type AllowedComponent,
  collectInteractiveComponents,
  isAllowedComponent,
} from '@repo/shared';
import { ButtonStyle, ComponentType, SeparatorSpacingSize } from 'discord-api-types/v10';
import z from 'zod';
import { countTotalComponents } from './utils';

export const SnowflakeRegex = /^\d{17,19}$/;

export const snowflakeIdSchema = z.string().regex(SnowflakeRegex, '無効なIDです').nullable();

export const snowflakeArraySchema = z
  .array(z.string().regex(SnowflakeRegex, '無効なIDです'))
  .refine((v) => new Set(v).size === v.length, '重複した値が含まれています。');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createUrlOrPlaceholderSchema(placeholders?: Placeholder) {
  const urlPlaceholderKeys = placeholders?.filter((p) => p.type === 'url').map((p) => p.key) ?? [];
  const placeholderRegex = urlPlaceholderKeys.length
    ? new RegExp(`^\\{\\{\\s*(?:${urlPlaceholderKeys.map(escapeRegExp).join('|')})\\s*\\}\\}$`)
    : null;

  return z
    .string({ error: '有効なURLを入力してください。' })
    .min(1, '有効なURLを入力してください。')
    .refine((value) => Boolean(placeholderRegex?.test(value)) || z.url().safeParse(value).success, {
      error: '有効なURLを入力してください。',
    });
}

function createUserComponentV2Schema(
  placeholders: Placeholder | undefined,
  allowedComponents: readonly AllowedComponent[],
) {
  const UnfurledMediaItem = z.object({
    url: createUrlOrPlaceholderSchema(placeholders),
  });

  const MediaGalleryItem = z.object({
    media: UnfurledMediaItem,
    description: z.string().max(1024).nullable().optional(),
    spoiler: z.boolean().optional(),
  });

  const TextDisplay = z.object({
    type: z.literal(ComponentType.TextDisplay),
    id: z.number().int().optional(),
    content: z.string().min(1, 'テキストを入力してください。'),
  });

  const Thumbnail = z.object({
    type: z.literal(ComponentType.Thumbnail),
    id: z.number().int().optional(),
    media: UnfurledMediaItem,
    description: z.string().max(1024).nullable().optional(),
    spoiler: z.boolean().optional(),
  });

  const MediaGallery = z.object({
    type: z.literal(ComponentType.MediaGallery),
    id: z.number().int().optional(),
    items: z.array(MediaGalleryItem).min(1, '画像が少なくとも1つ以上必要です。').max(10),
  });

  const File = z.object({
    type: z.literal(ComponentType.File),
    id: z.number().int().optional(),
    file: UnfurledMediaItem,
    spoiler: z.boolean().optional(),
  });

  const Separator = z.object({
    type: z.literal(ComponentType.Separator),
    id: z.number().int().optional(),
    divider: z.boolean().optional(),
    spacing: z.enum(SeparatorSpacingSize).optional(),
  });

  const ButtonBase = z.object({
    type: z.literal(ComponentType.Button),
    id: z.number().int().optional(),
    label: z
      .string()
      .max(80)
      .optional()
      .transform((v) => v || undefined),
    emoji: z
      .object({
        id: z.string().regex(SnowflakeRegex).optional(),
        name: z.string().min(1),
        animated: z.boolean().optional(),
      })
      .nullish()
      .transform((v) => v ?? undefined),
  });

  const hasLabelOrEmoji = (v: { label?: string; emoji?: object }) => !!(v.label || v.emoji);
  const hasLabelOrEmojiParams = {
    error: 'ラベルまたは絵文字を設定してください。',
    path: ['label'],
  };

  // custom_idは任意のインタラクションを実行できてしまうため、許可されたIDのみを受け付ける
  const InteractiveButton = ButtonBase.extend({
    style: z.union([
      z.literal(ButtonStyle.Primary),
      z.literal(ButtonStyle.Secondary),
      z.literal(ButtonStyle.Success),
      z.literal(ButtonStyle.Danger),
    ]),
    custom_id: z
      .string({ error: 'アクションを選択してください。' })
      .refine(
        (customId) =>
          isAllowedComponent(allowedComponents, { type: ComponentType.Button, customId }),
        '許可されていないボタンです。',
      ),
  }).refine(hasLabelOrEmoji, hasLabelOrEmojiParams);

  // URLボタンはインタラクションを発生させないため、custom_idの代わりにurlを持つ
  const LinkButton = ButtonBase.extend({
    style: z.literal(ButtonStyle.Link),
    url: createUrlOrPlaceholderSchema(placeholders).max(512),
  }).refine(hasLabelOrEmoji, hasLabelOrEmojiParams);

  // スタイルで判別し、もう一方のフィールド (custom_idまたはurl) は取り除かれる
  const Button = z.discriminatedUnion('style', [InteractiveButton, LinkButton]);

  const ActionRow = z.object({
    type: z.literal(ComponentType.ActionRow),
    id: z.number().int().optional(),
    // SelectMenuを追加する場合はunionに加える (SelectMenuは1行に1つまで)
    components: z
      .array(z.discriminatedUnion('type', [Button]))
      .min(1, '要素が少なくとも1つ以上必要です。')
      .max(5)
      .refine((c) => c.every((x) => x.type === c[0]?.type), '同じ種類の要素のみ配置できます。'),
  });

  const Section = z.object({
    type: z.literal(ComponentType.Section),
    id: z.number().int().optional(),
    components: z.array(TextDisplay).min(1, '要素が少なくとも1つ以上必要です。').max(3),
    accessory: z
      .discriminatedUnion('type', [Thumbnail, Button])
      // エディターでは未設定をnullで表す (RHFはundefinedを初期値にフォールバックするため)
      .nullable()
      .transform((v, ctx) => {
        if (v) return v;
        ctx.addIssue({ code: 'custom', message: 'サムネイルまたはボタンを設定してください。' });
        return z.NEVER;
      }),
  });

  const ComponentsInContainer = [
    Section,
    TextDisplay,
    MediaGallery,
    File,
    Separator,
    ActionRow,
  ] as const;

  const Container = z.object({
    type: z.literal(ComponentType.Container),
    id: z.number().int().optional(),
    accent_color: z
      .number()
      .int()
      .min(0)
      .max(0xffffff)
      .nullable()
      .optional()
      .transform((v) => v ?? undefined),
    spoiler: z.boolean().optional(),
    components: z
      .array(z.discriminatedUnion('type', ComponentsInContainer))
      .min(1, '要素が少なくとも1つ以上必要です。')
      .max(10),
  });

  const TopLevelComponent = z.discriminatedUnion('type', [Container, ...ComponentsInContainer]);

  return {
    TextDisplay,
    Thumbnail,
    MediaGallery,
    File,
    Separator,
    Section,
    Button,
    ActionRow,
    Container,
    TopLevelComponent,
  };
}

/**
 * @param allowedComponents 設置を許可するインタラクティブコンポーネント。未指定の場合は設置できない。
 */
export function createMessageUserComponentsSchema(
  placeholders?: Placeholder,
  allowedComponents: readonly AllowedComponent[] = [],
) {
  const { TopLevelComponent } = createUserComponentV2Schema(placeholders, allowedComponents);

  return z
    .array(TopLevelComponent)
    .min(1, '要素が少なくとも1つ以上必要です。')
    .superRefine((components, ctx) => {
      if (countTotalComponents(components) > 40) {
        ctx.addIssue({
          code: 'custom',
          message: '要素の合計が40を超えています',
        });
      }
      // custom_idはコンポーネントの種類に関係なくメッセージ内で一意である必要がある
      const interactives = collectInteractiveComponents(components);
      for (const { customId, path } of interactives) {
        if (interactives.filter((c) => c.customId === customId).length < 2) continue;
        ctx.addIssue({
          code: 'custom',
          message: '同じ動作のコンポーネントを複数設置することはできません。',
          path: [...path, 'custom_id'],
        });
      }
    });
}
export type MessageUserComponentsSchema = ReturnType<typeof createMessageUserComponentsSchema>;
