import { customAction } from '@repo/database';
import { CustomActionCustomIdPrefix, parseCustomActionCustomId } from '@repo/shared';
import { MessageFlags } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { Button, execute } from 'sunar';
import { db } from '@/src/lib/db';
import { errorMessage } from '@/src/lib/format';
import { runStep } from '../custom-action-steps';

export const button = new Button({ id: new RegExp(`^${CustomActionCustomIdPrefix}`) });

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const actionId = parseCustomActionCustomId(interaction.customId);
  const action = actionId
    ? await db.query.customAction.findFirst({
        where: and(eq(customAction.id, actionId), eq(customAction.guildId, interaction.guildId)),
      })
    : undefined;

  if (!action?.steps.length) {
    return interaction.reply({
      content: errorMessage('このボタンは使用できません。'),
      flags: [MessageFlags.Ephemeral],
    });
  }

  for (const step of action.steps) {
    const result = await runStep(step, interaction);
    if (result.ok) continue;

    const error = {
      content: result.error,
      flags: [MessageFlags.Ephemeral],
      allowedMentions: { parse: [] },
    } as const;
    return interaction.replied || interaction.deferred
      ? interaction.followUp(error)
      : interaction.reply(error);
  }

  // どの処理も返信しなかった場合はinteraction.update({})
  if (!interaction.replied && !interaction.deferred) await interaction.update({});
});
