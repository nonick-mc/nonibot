import { memberLevel } from '@repo/database';
import { getNeedXP } from '@repo/shared';
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  inlineCode,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { execute, Slash } from 'sunar';
import { applyRoleRewards } from '@/src/app/features/level/role-rewards';
import { siUnit } from '@/src/app/features/level/xp';
import { db } from '@/src/lib/db';
import { errorMessage, successMessage, unorderedListTable } from '@/src/lib/format';

export const slash = new Slash({
  name: 'setlevel',
  description: 'メンバーのレベルと経験値を変更',
  options: [
    {
      name: 'user',
      description: '変更するユーザー',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'level',
      description: '変更後のレベル',
      type: ApplicationCommandOptionType.Integer,
      minValue: 0,
      maxValue: 10000,
      required: true,
    },
    {
      name: 'exp',
      description: '変更後の経験値(次のレベルまでに必要な経験値未満)',
      type: ApplicationCommandOptionType.Integer,
      minValue: 0,
      required: true,
    },
    {
      name: 'role_sync',
      description: 'レベルに応じてロール報酬を付与・剥奪するか',
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
});

const format = (lv: number, xp: number) => `Lv.${lv} (${siUnit(xp)} XP)`;

execute(slash, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  const guildId = interaction.guild.id;

  const setting = await db.query.levelSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guildId),
  });
  if (!setting?.enabled)
    return interaction.reply({
      content: errorMessage('このサーバーではレベル機能が無効です'),
      flags: MessageFlags.Ephemeral,
    });

  const user = interaction.options.getUser('user', true);
  const lv = interaction.options.getInteger('level', true);
  const xp = interaction.options.getInteger('exp', true);

  if (user.bot)
    return interaction.reply({
      content: errorMessage('Botのレベルは変更できません'),
      flags: MessageFlags.Ephemeral,
    });

  const member = interaction.options.getMember('user');
  if (!member)
    return interaction.reply({
      content: errorMessage('このサーバーのメンバーではないユーザーのレベルは変更できません'),
      flags: MessageFlags.Ephemeral,
    });

  const need = getNeedXP(lv);
  if (xp >= need)
    return interaction.reply({
      content: errorMessage(
        `レベル${lv}の場合、経験値は${inlineCode(`${need}`)}未満にしてください`,
      ),
      flags: MessageFlags.Ephemeral,
    });

  const before = await db.query.memberLevel.findFirst({
    where: (t, { and, eq }) => and(eq(t.guildId, guildId), eq(t.userId, user.id)),
  });

  await db
    .insert(memberLevel)
    .values({ guildId, userId: user.id, lv, xp, lastGainedAt: new Date(0) })
    .onConflictDoUpdate({ target: [memberLevel.guildId, memberLevel.userId], set: { lv, xp } });

  const beforeLv = before?.lv ?? 0;
  if (interaction.options.getBoolean('role_sync') !== false && lv !== beforeLv) {
    await applyRoleRewards(member, setting.roleRewards, beforeLv, lv);
  }

  interaction.reply({
    content: [
      successMessage(`${user}のレベルを変更しました`),
      unorderedListTable([
        { label: '変更前', value: format(before?.lv ?? 0, before?.xp ?? 0) },
        { label: '変更後', value: format(lv, xp) },
      ]),
    ].join('\n'),
    flags: MessageFlags.Ephemeral,
  });
});
