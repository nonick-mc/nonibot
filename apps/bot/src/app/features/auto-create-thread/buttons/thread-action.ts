import { AutoCreateThreadCustomIdPrefix } from '@repo/shared';
import {
  Colors,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  TextDisplayBuilder,
} from 'discord.js';
import { Button, execute, protect } from 'sunar';
import { appPerms } from '@/src/app/shared/protectors/perms';
import { errorMessage, successMessage } from '@/src/lib/format';

export const button = new Button({ id: new RegExp(`^${AutoCreateThreadCustomIdPrefix}`) });

const threadStates: Record<string, { archived: boolean; locked: boolean; label: string }> = {
  [`${AutoCreateThreadCustomIdPrefix}archive`]: {
    archived: true,
    locked: false,
    label: 'アーカイブ',
  },
  [`${AutoCreateThreadCustomIdPrefix}lock`]: { archived: false, locked: true, label: 'ロック' },
  [`${AutoCreateThreadCustomIdPrefix}archive-lock`]: {
    archived: true,
    locked: true,
    label: 'アーカイブ&ロック',
  },
};

protect(button, [appPerms(PermissionFlagsBits.ManageThreads)]);

execute(button, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const state = threadStates[interaction.customId];
  if (!state) return;

  const thread = interaction.channel;
  if (!thread?.isThread()) return;

  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageThreads)) {
    const starterMessage = await thread.fetchStarterMessage().catch(() => null);
    if (starterMessage?.author.id !== interaction.user.id) {
      return interaction.reply({
        content: errorMessage('このスレッドを操作する権限がありません。'),
        flags: [MessageFlags.Ephemeral],
      });
    }
  }

  if ((!state.archived || thread.archived) && (!state.locked || thread.locked)) {
    return interaction.reply({
      content: errorMessage(`このスレッドは既に${state.label}されています。`),
      flags: [MessageFlags.Ephemeral],
    });
  }

  // アーカイブ済みのスレッドに送信すると再オープンされるため、状態を変更する前に返信する
  await interaction.reply({
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Green)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            successMessage(`${interaction.user}がスレッドを${state.label}しました。`),
          ),
        ),
    ],
    flags: [MessageFlags.IsComponentsV2],
    allowedMentions: { parse: [] },
  });

  await thread
    .edit({
      ...(state.archived && { archived: true }),
      ...(state.locked && { locked: true }),
      reason: `${interaction.user.tag}によって実行されました`,
    })
    .catch((e) => console.error(e));
});
