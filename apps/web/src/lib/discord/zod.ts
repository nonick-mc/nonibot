import { ComponentType, SeparatorSpacingSize } from 'discord-api-types/v10';
import z from 'zod';
import { countTotalComponents } from './utils';

export const SnowflakeRegex = /^\d{17,19}$/;

// Embeds (フォームの機能強化に合わせてバリデーション強化が必要)
export const embedSchema = z
  .object({
    title: z.string().max(256).optional(),
    description: z.string().max(4096).optional(),
    color: z.number().int().optional(),
  })
  .superRefine((v, ctx) => {
    const embedContentsLength = [v.title?.length, v.description?.length].reduce<number>(
      (sum, num) => sum + (num || 0),
      0,
    );

    if (embedContentsLength > 6000) {
      ctx.addIssue({
        code: 'custom',
        message: '埋め込みの内容が6000文字を超えています。',
        path: ['title'],
      });
    }

    if (embedContentsLength === 0) {
      ctx.addIssue({
        code: 'custom',
        message: '埋め込みの内容が必要です',
        path: ['title'],
      });
    }
  });

export namespace UserComponentV2Schema {
  const UnfurledMediaItem = z.object({
    url: z.url({ error: () => '有効なURLを入力してください。' }).min(1),
  });

  const MediaGalleryItem = z.object({
    media: UnfurledMediaItem,
    description: z.string().max(1024).nullable().optional(),
    spoiler: z.boolean().optional(),
  });

  export const TextDisplay = z.object({
    type: z.literal(ComponentType.TextDisplay),
    id: z.number().int().optional(),
    content: z.string().min(1, 'テキストを入力してください。'),
  });

  export const Thumbnail = z.object({
    type: z.literal(ComponentType.Thumbnail),
    id: z.number().int().optional(),
    media: UnfurledMediaItem,
    description: z.string().max(1024).nullable().optional(),
    spoiler: z.boolean().optional(),
  });

  export const MediaGallery = z.object({
    type: z.literal(ComponentType.MediaGallery),
    id: z.number().int().optional(),
    items: z.array(MediaGalleryItem).min(1, '画像が少なくとも1つ以上必要です。').max(10),
  });

  export const File = z.object({
    type: z.literal(ComponentType.File),
    id: z.number().int().optional(),
    file: UnfurledMediaItem,
    spoiler: z.boolean().optional(),
  });

  export const Separator = z.object({
    type: z.literal(ComponentType.Separator),
    id: z.number().int().optional(),
    divider: z.boolean().optional(),
    spacing: z.enum(SeparatorSpacingSize).optional(),
  });

  export const Section = z.object({
    type: z.literal(ComponentType.Section),
    id: z.number().int().optional(),
    components: z.array(TextDisplay).min(1, '要素が少なくとも1つ以上必要です。').max(3),
    accessory: Thumbnail,
  });

  const ComponentsInContainer = [Section, TextDisplay, MediaGallery, File, Separator] as const;

  export const Container = z.object({
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

  export const TopLevelComponent = z.discriminatedUnion('type', [
    Container,
    ...ComponentsInContainer,
  ]);
}

export const messageUserComponentsSchema = z
  .array(UserComponentV2Schema.TopLevelComponent)
  .min(1, '要素が少なくとも1つ以上必要です。')
  .superRefine((components, ctx) => {
    if (countTotalComponents(components) > 40) {
      ctx.addIssue({
        code: 'custom',
        message: '要素の合計が40を超えています',
      });
    }
  });

// Message
export const messageOptionSchema = z
  .object({
    content: z.string().max(2000).optional(),
    embeds: z.array(embedSchema).max(10).optional(),
    // 必要に応じて他のプロパティを追加
  })
  .superRefine((v, ctx) => {
    if (!v.content && !v.embeds?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'メッセージの内容が設定されていません。',
        path: ['content'],
      });
    }
  });
