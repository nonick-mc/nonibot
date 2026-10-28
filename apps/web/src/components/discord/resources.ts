import type { Placeholder } from '@repo/placeholders';
import type { AllowedComponent, RoleButtonRules } from '@repo/shared';
import type { InternalApiChannel, InternalApiEmoji, InternalApiRole } from '@repo/shared/types';

export type MessageResources = {
  emojis?: InternalApiEmoji[];
  roles?: InternalApiRole[];
  channels?: InternalApiChannel[];
  allowedComponents?: AllowedComponent[];
  placeholders?: Placeholder;
  roleButton?: RoleButtonRules & { guildId: string };
};
