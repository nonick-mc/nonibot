import type { APIMessageTopLevelComponent } from 'discord-api-types/v10';
import { boolean, integer, jsonb, pgEnum, pgSchema, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../utils';
import { guild } from './guild';

export const settingSchema = pgSchema('public_setting');

const guildId = text('guild_id')
  .primaryKey()
  .references(() => guild.id, { onDelete: 'cascade' });

// #region JoinMessage
export const sendTriggerEnum = pgEnum('send_trigger', ['joined', 'passedMembershipGate']);
export const joinMessageSetting = settingSchema.table('join_message', {
  guildId,
  enabled: boolean('enabled').notNull(),
  channel: text('channel'),
  sendTrigger: sendTriggerEnum('send_trigger').notNull(),
  ignoreBot: boolean('ignore_bot').notNull(),
  messageComponents: jsonb('message_components')
    .array()
    .$type<APIMessageTopLevelComponent[]>()
    .notNull(),
  dmEnabled: boolean('dm_enabled').notNull(),
  dmMessageComponents: jsonb('dm_message_components')
    .array()
    .$type<APIMessageTopLevelComponent[]>()
    .notNull(),
  ...timestamps,
});
// #endregion

// #region LeaveMessage
export const leaveMessageSetting = settingSchema.table('leave_message', {
  guildId,
  enabled: boolean('enabled').notNull(),
  channel: text('channel'),
  ignoreBot: boolean('ignore_bot').notNull(),
  messageComponents: jsonb('message_components')
    .array()
    .$type<APIMessageTopLevelComponent[]>()
    .notNull(),
  ...timestamps,
});
// #endregion

// #region Report
export const reportSetting = settingSchema.table('report', {
  guildId,
  enabled: boolean('enabled').notNull(),
  channel: text('channel'),
  forumCompletedTag: text('forum_completed_tag'),
  forumIgnoredTag: text('forum_ignored_tag'),
  categories: jsonb('categories')
    .array()
    .$type<{ label: string; emoji: string | null }[]>()
    .notNull(),
  includeModerator: boolean('include_moderator').notNull(),
  ignoreRoles: text('ignore_roles').array().notNull(),
  showModerateLog: boolean('show_moderate_log').notNull(),
  mentionRoles: text('mention_roles').array().notNull(),
  ...timestamps,
});
// #endregion

// #region EventLog
const baseLogSetting = {
  guildId,
  enabled: boolean('enabled').notNull(),
  channel: text('channel'),
  ...timestamps,
};

export const timeoutLogSetting = settingSchema.table('timeout_log', baseLogSetting);
export const kickLogSetting = settingSchema.table('kick_log', baseLogSetting);
export const banLogSetting = settingSchema.table('ban_log', baseLogSetting);
export const voiceLogSetting = settingSchema.table('voice_log', baseLogSetting);
export const msgDeleteLogSetting = settingSchema.table('message_delete_log', baseLogSetting);
export const msgEditLogSetting = settingSchema.table('message_edit_log', baseLogSetting);
// #endregion

// #region MessageExpand
export const msgExpandSetting = settingSchema.table('message_expand', {
  guildId,
  enabled: boolean('enabled').notNull(),
  allowExternalGuild: boolean('allow_external_guild').notNull(),
  ignoreChannels: text('ignore_channels').array().notNull(),
  ignoreChannelTypes: integer('ignore_channel_types').array().notNull(),
  ignorePrefixes: text('ignore_prefixes').array().notNull(),
  ...timestamps,
});
// #endregion

// #region AutoChangeVerifyLevel
export const autoChangeVerifyLevelSetting = settingSchema.table('auto_change_verify_level', {
  guildId,
  enabled: boolean('enabled').notNull(),
  startHour: integer('start_hour').notNull(),
  endHour: integer('end_hour').notNull(),
  level: integer('level').notNull(),
  enableLog: boolean('enable_log').notNull(),
  logChannel: text('log_channel'),
  ...timestamps,
});
// #endregion

// #region AutoPublic
export const autoPublicSetting = settingSchema.table('auto_public', {
  guildId,
  enabled: boolean('enabled').notNull(),
  channels: text('channels').array().notNull(),
  ...timestamps,
});
// #endregion

// #region AutoMod
export const autoModSetting = settingSchema.table('auto_mod', {
  guildId,
  enabled: boolean('enabled').notNull(),
  enableDomainFilter: boolean('enable_domain_filter').notNull(),
  enableInviteUrlFilter: boolean('enable_invite_url_filter').notNull(),
  enableTokenFilter: boolean('enable_token_filter').notNull(),
  domainList: text('domain_list').array().notNull(),
  ignoreChannels: text('ignore_channels').array().notNull(),
  ignoreRoles: text('ignore_roles').array().notNull(),
  enableLog: boolean('enable_log').notNull(),
  logChannel: text('log_channel'),
  ...timestamps,
});
// #endregion

// #region Verification
export const captchaTypeEnum = pgEnum('captcha_type', ['button', 'image', 'web']);
export const verificationSetting = settingSchema.table('verification', {
  guildId,
  enabled: boolean('enabled').notNull(),
  role: text('role'),
  captchaType: captchaTypeEnum('captcha_type').notNull(),
  ...timestamps,
});
// #endregion
