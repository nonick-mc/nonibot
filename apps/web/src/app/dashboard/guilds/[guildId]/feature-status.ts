import {
  autoChangeVerifyLevelSetting,
  autoCreateThreadRule,
  autoModSetting,
  autoPublicSetting,
  banLogSetting,
  joinMessageSetting,
  kickLogSetting,
  leaveMessageSetting,
  msgDeleteLogSetting,
  msgEditLogSetting,
  msgExpandSetting,
  reportSetting,
  timeoutLogSetting,
  verificationSetting,
  voiceLogSetting,
} from '@repo/database';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';

type SettingTable =
  | typeof joinMessageSetting
  | typeof leaveMessageSetting
  | typeof reportSetting
  | typeof banLogSetting
  | typeof kickLogSetting
  | typeof timeoutLogSetting
  | typeof voiceLogSetting
  | typeof msgDeleteLogSetting
  | typeof msgEditLogSetting
  | typeof msgExpandSetting
  | typeof autoChangeVerifyLevelSetting
  | typeof autoPublicSetting
  | typeof autoModSetting
  | typeof verificationSetting;

export async function getFeatureStatuses(guildId: string): Promise<Record<string, boolean>> {
  const isEnabled = async (table: SettingTable) => {
    const [row] = await db
      .select({ enabled: table.enabled })
      .from(table)
      .where(eq(table.guildId, guildId))
      .limit(1);
    return row?.enabled ?? false;
  };

  const [
    joinMessage,
    leaveMessage,
    report,
    eventLogs,
    messageExpand,
    autoChangeVerificationLevel,
    autoPublic,
    autoCreateThread,
    automodPlus,
    verification,
  ] = await Promise.all([
    isEnabled(joinMessageSetting),
    isEnabled(leaveMessageSetting),
    isEnabled(reportSetting),
    Promise.all(
      [
        banLogSetting,
        kickLogSetting,
        timeoutLogSetting,
        voiceLogSetting,
        msgDeleteLogSetting,
        msgEditLogSetting,
      ].map(isEnabled),
    ),
    isEnabled(msgExpandSetting),
    isEnabled(autoChangeVerifyLevelSetting),
    isEnabled(autoPublicSetting),
    db
      .select({ enabled: autoCreateThreadRule.enabled })
      .from(autoCreateThreadRule)
      .where(and(eq(autoCreateThreadRule.guildId, guildId), eq(autoCreateThreadRule.enabled, true)))
      .limit(1)
      .then((rows) => rows.length > 0),
    isEnabled(autoModSetting),
    isEnabled(verificationSetting),
  ]);

  return {
    'join-message': joinMessage,
    'leave-message': leaveMessage,
    report,
    'event-log': eventLogs.some(Boolean),
    'message-expand': messageExpand,
    'auto-change-verification-level': autoChangeVerificationLevel,
    'auto-public': autoPublic,
    'auto-create-thread': autoCreateThread,
    'automod-plus': automodPlus,
    verification,
  };
}
