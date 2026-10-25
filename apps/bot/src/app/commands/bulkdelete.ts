import { stripIndents } from 'common-tags';
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  inlineCode,
  MessageFlags,
  PermissionFlagsBits,
  subtext,
} from 'discord.js';
import { execute, protect, Slash } from 'sunar';
import { appPerms } from '@/src/app/shared/protectors/perms';
import { errorMessage, successMessage } from '@/src/lib/format';

export const slash = new Slash({
  name: 'bulkdelete',
  description: 'このチャンネルに送信されたメッセージを最新順に一括削除 (2週間前まで)',
  options: [
    {
      name: 'messages',
      description: '削除するメッセージの数',
      type: ApplicationCommandOptionType.Integer,
      minValue: 2,
      maxValue: 100,
      required: true,
    },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
});

protect(slash, [appPerms(PermissionFlagsBits.ManageMessages)]);

execute(slash, async (interaction) => {
  if (!interaction.inGuild() || !interaction.channel || interaction.channel.isDMBased()) return;

  const count = interaction.options.getInteger('messages', true);
  const deleted = await interaction.channel.bulkDelete(count, true).catch(() => null);

  if (!deleted)
    return interaction.reply({
      content: errorMessage('メッセージの削除に失敗しました'),
      flags: [MessageFlags.Ephemeral],
    });

  if (!deleted.size)
    return interaction.reply({
      content: errorMessage(stripIndents`
        削除できるメッセージがありません
        ${subtext(`${inlineCode('/bulkdelete')}は2週間以内のメッセージのみ削除できます。`)}
      `),
      flags: [MessageFlags.Ephemeral],
    });

  interaction.reply({
    content: successMessage(`メッセージを${inlineCode(String(deleted.size))}件削除しました`),
    flags: [MessageFlags.Ephemeral],
  });
});
