import { memberLevel } from '@repo/database';
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  AttachmentBuilder,
  InteractionContextType,
  MessageFlags,
} from 'discord.js';
import { eq, sql } from 'drizzle-orm';
import { config, execute, Slash } from 'sunar';
import { createRankCard } from '@/src/app/features/level/rank-card';
import { db } from '@/src/lib/db';
import { errorMessage } from '@/src/lib/format';

export const slash = new Slash({
  name: 'rank',
  description: 'メンバーのレベルとランクを表示',
  options: [
    {
      name: 'user',
      description: '表示するユーザー(省略すると自分)',
      type: ApplicationCommandOptionType.User,
    },
    {
      name: 'public',
      description: '結果を他のメンバーにも公開するか',
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
});

config(slash, { cooldown: 10_000 });

execute(slash, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  const { guild } = interaction;

  const setting = await db.query.levelSetting.findFirst({
    where: (setting, { eq }) => eq(setting.guildId, guild.id),
  });
  if (!setting?.enabled)
    return interaction.reply({
      content: errorMessage('このサーバーではレベル機能が無効です'),
      flags: MessageFlags.Ephemeral,
    });

  const user = interaction.options.getUser('user') ?? interaction.user;

  // 順位はWHEREより先に計算する必要があるため、サブクエリで全体の順位を出してから対象ユーザーを絞る
  const ranked = db
    .select({
      userId: memberLevel.userId,
      lv: memberLevel.lv,
      xp: memberLevel.xp,
      rank: sql<number>`(rank() over (order by ${memberLevel.lv} desc, ${memberLevel.xp} desc))::int`.as(
        'rank',
      ),
    })
    .from(memberLevel)
    .where(eq(memberLevel.guildId, guild.id))
    .as('ranked');
  const [data] = user.bot ? [] : await db.select().from(ranked).where(eq(ranked.userId, user.id));

  if (!data)
    return interaction.reply({
      content: errorMessage('データがありません'),
      flags: MessageFlags.Ephemeral,
    });

  await interaction.deferReply({
    flags: interaction.options.getBoolean('public') ? undefined : MessageFlags.Ephemeral,
  });

  // サーバーを抜けたユーザーでもデータが残っていれば表示
  const member = await guild.members.fetch(user.id).catch(() => null);
  const card = await createRankCard({
    name: member?.displayName ?? user.displayName,
    username: user.username,
    avatarUrl: (member ?? user).displayAvatarURL({ extension: 'png', size: 256 }),
    color: member?.roles.highest.color,
    lv: data.lv,
    xp: data.xp,
    rank: data.rank,
  });

  await interaction.editReply({ files: [new AttachmentBuilder(card, { name: 'rank.png' })] });
});
