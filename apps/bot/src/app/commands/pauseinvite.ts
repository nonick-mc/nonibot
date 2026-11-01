import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  GuildFeature,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { execute, protect, Slash } from 'sunar';
import { appPerms } from '@/src/app/shared/protectors/perms';
import { errorMessage, successMessage } from '@/src/lib/format';

export const slash = new Slash({
  name: 'pauseinvite',
  description: 'サーバー招待の一時停止状態を切り替えます',
  options: [
    {
      name: 'pause',
      description: '一時停止するか',
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
});

protect(slash, [appPerms(PermissionFlagsBits.ManageGuild)]);

execute(slash, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const pause = interaction.options.getBoolean('pause', true);

  if (interaction.guild.features.includes(GuildFeature.InvitesDisabled) === pause)
    return interaction.reply({
      content: errorMessage('既にその状態です'),
      flags: [MessageFlags.Ephemeral],
    });

  const result = await interaction.guild.disableInvites(pause).catch(() => null);

  interaction.reply({
    content: result
      ? successMessage(`サーバー招待を${pause ? '一時停止' : '有効に'}しました`)
      : errorMessage('招待一時停止状態の変更に失敗しました'),
    flags: [MessageFlags.Ephemeral],
  });
});
