import type { Placeholder } from '@repo/placeholders';
import type {
  ComponentAction,
  InternalApiChannel,
  InternalApiEmoji,
  InternalApiRole,
} from '@repo/shared';

export type MessageResources = {
  emojis?: InternalApiEmoji[];
  roles?: InternalApiRole[];
  channels?: InternalApiChannel[];
  componentActions?: ComponentAction[];
  placeholders?: Placeholder;
};
