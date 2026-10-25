import type { Placeholder } from '@repo/placeholders';
import type { ComponentAction } from '@repo/shared';
import type { InternalApiChannel, InternalApiEmoji, InternalApiRole } from '@repo/shared/types';

export type MessageResources = {
  emojis?: InternalApiEmoji[];
  roles?: InternalApiRole[];
  channels?: InternalApiChannel[];
  componentActions?: ComponentAction[];
  placeholders?: Placeholder;
};
