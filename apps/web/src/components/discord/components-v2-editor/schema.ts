import { ComponentType, SeparatorSpacingSize } from 'discord-api-types/v10';
import type z from 'zod';
import type { MessageUserComponentsSchema } from '@/lib/discord/zod';

type Component = z.input<MessageUserComponentsSchema>[number];
type Section = Extract<Component, { type: ComponentType.Section }>;
type Thumbnail = Extract<Section['accessory'], { type: ComponentType.Thumbnail }>;

export const defaultComponentValues: {
  [K in
    | ComponentType.TextDisplay
    | ComponentType.Section
    | ComponentType.MediaGallery
    | ComponentType.Separator
    | ComponentType.Container
    | ComponentType.ActionRow
    | ComponentType.Thumbnail]: Extract<Component | Thumbnail, { type: K }>;
} = {
  [ComponentType.TextDisplay]: {
    type: ComponentType.TextDisplay,
    content: '',
  },
  [ComponentType.Section]: {
    type: ComponentType.Section,
    components: [],
    accessory: null,
  },
  [ComponentType.MediaGallery]: {
    type: ComponentType.MediaGallery,
    items: [{ media: { url: '' }, spoiler: false }],
  },
  [ComponentType.Separator]: {
    type: ComponentType.Separator,
    divider: true,
    spacing: SeparatorSpacingSize.Small,
  },
  [ComponentType.Container]: {
    type: ComponentType.Container,
    accent_color: null,
    spoiler: false,
    components: [],
  },
  [ComponentType.ActionRow]: {
    type: ComponentType.ActionRow,
    components: [],
  },
  [ComponentType.Thumbnail]: {
    type: ComponentType.Thumbnail,
    media: { url: '' },
    spoiler: false,
  },
};
