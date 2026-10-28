import { customAction } from '@repo/database';
import { CustomActionCustomIdPrefix, parseCustomActionCustomId } from '@repo/shared';
import { MessageFlags } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { Button, execute } from 'sunar';
import { db } from '@/src/lib/db';
import { errorMessage } from '@/src/lib/format';
import { runStep, type StepResult } from '../custom-action-steps';

export const button = new Button({ id: new RegExp(`^${CustomActionCustomIdPrefix}`) });

const SuccessMessageLifetime = 3_000;

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const actionId = parseCustomActionCustomId(interaction.customId);
  const action =
    actionId &&
    (await db.query.customAction.findFirst({
      where: and(eq(customAction.id, actionId), eq(customAction.guildId, interaction.guildId)),
    }));

  const results: StepResult[] = [];
  if (action) {
    for (const step of action.steps) {
      const result = await runStep(step, interaction);
      results.push(result);
      if (!result.ok) break;
    }
  }

  const ok = !!action && results.every((r) => r.ok);
  await interaction.reply({
    content: action
      ? results.map((r) => r.message).join('\n')
      : errorMessage('このボタンは使用できません。'),
    flags: [MessageFlags.Ephemeral],
    allowedMentions: { parse: [] },
  });
  if (ok) setTimeout(() => interaction.deleteReply().catch(() => {}), SuccessMessageLifetime);
});
