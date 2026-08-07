import type { joinMessageSetting } from '@repo/database';
import { renderPlaceholders } from '@repo/placeholders';
import { Events, type GuildMember, MessageFlags } from 'discord.js';
import type { InferSelectModel } from 'drizzle-orm';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { getJoinMessagePlaceholderParams } from '@/src/lib/placeholder';

export const signal = new Signal(Events.GuildMemberAdd);

execute(signal, async (member) => {
  const setting = await db.query.joinMessageSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, member.guild.id),
  });
  if (!setting) return;

  await sendToChannel(setting, member);
  await sendToDM(setting, member);
});

async function sendToChannel(
  setting: InferSelectModel<typeof joinMessageSetting>,
  member: GuildMember,
) {
  if (!setting.enabled) return;
  if (setting.ignoreBot && member.user.bot) return;

  const channel = await member.guild.channels.fetch(setting.channel as string).catch(() => null);
  if (!channel?.isTextBased()) return;

  channel
    .send({
      components: renderPlaceholders(
        setting.messageComponents,
        getJoinMessagePlaceholderParams(member),
      ),
      flags: MessageFlags.IsComponentsV2,
    })
    .catch((e) => console.error(e));
}

async function sendToDM(setting: InferSelectModel<typeof joinMessageSetting>, member: GuildMember) {
  if (!setting.dmEnabled || member.user.bot) return;

  await member
    .send({
      components: renderPlaceholders(
        setting.dmMessageComponents,
        getJoinMessagePlaceholderParams(member),
      ),
      flags: MessageFlags.IsComponentsV2,
    })
    .catch((e) => console.error(e));
}
