import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  inlineCode,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { execute, protect, Slash } from 'sunar';
import { appPerms } from '@/src/app/shared/protectors/perms';
import { errorMessage, successMessage } from '@/src/lib/format';

export const slash = new Slash({
  name: 'ratelimit',
  description: 'このチャンネルの低速モードを設定',
  options: [
    {
      name: 'duration',
      description: '秒数',
      minValue: 0,
      maxValue: 21600,
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
});

protect(slash, [appPerms(PermissionFlagsBits.ManageChannels)]);

execute(slash, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  if (!interaction.channel || !('setRateLimitPerUser' in interaction.channel))
    return interaction.reply({
      content: errorMessage('このチャンネルでは低速モードを設定できません'),
      flags: [MessageFlags.Ephemeral],
    });

  const duration = interaction.options.getInteger('duration', true);
  const result = await interaction.channel
    .setRateLimitPerUser(duration, `/ratelimit by ${interaction.user.username}`)
    .catch(() => null);

  interaction.reply({
    content: result
      ? successMessage(`チャンネルの低速モードを${inlineCode(String(duration))}秒に設定しました`)
      : errorMessage('低速モードの設定に失敗しました'),
    flags: [MessageFlags.Ephemeral],
  });
});
