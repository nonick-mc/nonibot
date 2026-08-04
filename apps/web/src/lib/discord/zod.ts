import type { Placeholder } from '@repo/placeholders';
import { ComponentType, SeparatorSpacingSize } from 'discord-api-types/v10';
import z from 'zod';
import { countTotalComponents } from './utils';

export const SnowflakeRegex = /^\d{17,19}$/;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createUrlOrPlaceholderSchema(placeholders?: Placeholder) {
  const urlPlaceholderKeys = placeholders?.filter((p) => p.isUrl).map((p) => p.key) ?? [];
  const placeholderRegex = urlPlaceholderKeys.length
    ? new RegExp(`^\\{\\{\\s*(?:${urlPlaceholderKeys.map(escapeRegExp).join('|')})\\s*\\}\\}$`)
    : null;

  return z
    .string()
    .min(1, '有効なURLを入力してください。')
    .refine((value) => Boolean(placeholderRegex?.test(value)) || z.url().safeParse(value).success, {
      error: '有効なURLを入力してください。',
    });
}

function createUserComponentV2Schema(placeholders: Placeholder | undefined) {
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

  const Section = z.object({
    type: z.literal(ComponentType.Section),
    id: z.number().int().optional(),
    components: z.array(TextDisplay).min(1, '要素が少なくとも1つ以上必要です。').max(3),
    accessory: Thumbnail,
  });

  const ComponentsInContainer = [Section, TextDisplay, MediaGallery, File, Separator] as const;

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
    Container,
    TopLevelComponent,
  };
}

export function createMessageUserComponentsSchema(placeholders?: Placeholder) {
  const { TopLevelComponent } = createUserComponentV2Schema(placeholders);

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
    });
}
export type MessageUserComponentsSchema = ReturnType<typeof createMessageUserComponentsSchema>;
