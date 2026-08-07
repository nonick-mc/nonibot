import { renderPlaceholders } from '@repo/placeholders';
import { Events, MessageFlags } from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { getLeaveMessagePlaceholderParams } from '@/src/lib/placeholder';

export const signal = new Signal(Events.GuildMemberRemove);

execute(signal, async (member) => {
  const setting = await db.query.leaveMessageSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, member.guild.id),
  });
  if (!setting) return;

  if (!setting.enabled) return;
  if (setting.ignoreBot && member.user.bot) return;

  const channel = await member.guild.channels.fetch(setting.channel as string).catch(() => null);
  if (!channel?.isTextBased()) return;

  channel.send({
    components: renderPlaceholders(
      setting.messageComponents,
      getLeaveMessagePlaceholderParams(member),
    ),
    flags: MessageFlags.IsComponentsV2,
  });
});
