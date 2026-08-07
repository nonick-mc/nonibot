import { Events, GuildFeature } from 'discord.js';
import { execute, Signal } from 'sunar';
import { db } from '@/src/lib/db';
import { sendToChannel, sendToDM } from '../send-message';

export const signal = new Signal(Events.GuildMemberUpdate);

execute(signal, async (oldMember, newMember) => {
  const setting = await db.query.joinMessageSetting.findFirst({
    where: (setting, { eq, and }) =>
      and(eq(setting.guildId, newMember.guild.id), eq(setting.sendTrigger, 'passedMembershipGate')),
  });
  if (!setting) return;

  console.log(oldMember.pending);
  console.log(newMember.pending);

  if (!newMember.guild.features.includes(GuildFeature.MemberVerificationGateEnabled)) return;
  if (oldMember.pending && !newMember.pending) {
    await sendToChannel(setting, newMember);
    await sendToDM(setting, newMember);
  }
});
