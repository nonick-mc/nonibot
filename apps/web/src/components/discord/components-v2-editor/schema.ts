import { ComponentType, SeparatorSpacingSize } from 'discord-api-types/v10';
import type z from 'zod';
import type { MessageUserComponentsSchema } from '@/lib/discord/zod';

export const defaultComponentValues: Record<
  | ComponentType.TextDisplay
  | ComponentType.Section
  | ComponentType.MediaGallery
  | ComponentType.Separator
  | ComponentType.Container,
  z.input<MessageUserComponentsSchema>[number]
> = {
  [ComponentType.TextDisplay]: {
    type: ComponentType.TextDisplay,
    content: '',
  },
  [ComponentType.Section]: {
    type: ComponentType.Section,
    components: [],
    accessory: {
      type: ComponentType.Thumbnail,
      media: { url: '' },
      spoiler: false,
    },
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
};
