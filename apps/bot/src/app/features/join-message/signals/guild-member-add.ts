import { Events, GuildFeature } from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { sendToChannel, sendToDM } from '../send-message';

export const signal = new Signal(Events.GuildMemberAdd);

execute(signal, async (member) => {
  const setting = await db.query.joinMessageSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, member.guild.id),
  });
  if (!setting) return;

  // sendTriggerが'passedMembershipGate'になっていた場合でも、サーバールールが指定されていなければ入室時に送信
  const hasGuildRules = member.guild.features.includes(GuildFeature.MemberVerificationGateEnabled);
  if (setting.sendTrigger === 'passedMembershipGate' && hasGuildRules) return;

  await sendToChannel(setting, member);
  await sendToDM(setting, member);
});
