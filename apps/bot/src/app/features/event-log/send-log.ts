import { type ContainerBuilder, type Guild, MessageFlags } from 'discord.js';
import { sendViaWebhook } from '@/src/lib/webhook';

type LogSetting = { enabled: boolean; channel: string | null; ignoreRoles: string[] } | undefined;

export async function sendEventLog(
  guild: Guild,
  setting: LogSetting,
  components: ContainerBuilder[],
  executorId?: string | null,
) {
  if (!setting?.enabled || !setting.channel) return;

  if (executorId && setting.ignoreRoles.length > 0) {
    const executor = await guild.members.fetch(executorId).catch(() => null);
    if (executor?.roles.cache.hasAny(...setting.ignoreRoles)) return;
  }

  await sendViaWebhook(guild, setting.channel, {
    components,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
}
