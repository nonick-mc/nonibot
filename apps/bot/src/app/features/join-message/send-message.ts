import type { joinMessageSetting } from '@repo/database';
import { renderPlaceholders } from '@repo/placeholders';
import { type GuildMember, MessageFlags } from 'discord.js';
import type { InferSelectModel } from 'drizzle-orm';
import { getJoinMessagePlaceholderParams } from '@/src/lib/placeholder';

export async function sendToChannel(
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

export async function sendToDM(
  setting: InferSelectModel<typeof joinMessageSetting>,
  member: GuildMember,
) {
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
