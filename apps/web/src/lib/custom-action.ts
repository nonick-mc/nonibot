import 'server-only';

import { createCustomActionCustomId } from '@repo/shared';
import { ComponentType } from 'discord-api-types/v10';
import { db } from '@/lib/db';

export async function getCustomActionAllowedComponents(guildId: string) {
  const actions = await db.query.customAction.findMany({
    where: (action, { eq }) => eq(action.guildId, guildId),
    columns: { id: true, name: true },
    orderBy: (action, { desc }) => desc(action.createdAt),
  });
  return actions.map(({ id, name }) => ({
    type: ComponentType.Button as const,
    customId: createCustomActionCustomId(id),
    label: name,
  }));
}
