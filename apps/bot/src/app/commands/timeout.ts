import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  InteractionContextType,
  inlineCode,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { execute, protect, Slash } from 'sunar';
import { appPerms } from '@/src/app/shared/protectors/perms';
import { errorMessage, successMessage } from '@/src/lib/format';

const Minute = 60_000;
const MaxDuration = 28 * 24 * 60 * Minute;

export const slash = new Slash({
  name: 'timeout',
  description: 'ユーザーをタイムアウト',
  options: [
    {
      name: 'user',
      description: 'ユーザー',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    { name: 'date', description: '日', type: ApplicationCommandOptionType.Number, minValue: 0 },
    { name: 'hour', description: '時', type: ApplicationCommandOptionType.Number, minValue: 0 },
    { name: 'minute', description: '分', type: ApplicationCommandOptionType.Number, minValue: 0 },
    { name: 'reason', description: '理由', type: ApplicationCommandOptionType.String },
  ],
  integrationTypes: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
});

protect(slash, [appPerms(PermissionFlagsBits.ModerateMembers)]);

const reply = (interaction: ChatInputCommandInteraction, content: string) =>
  interaction.reply({ content, flags: [MessageFlags.Ephemeral] });

execute(slash, async (interaction) => {
  if (!interaction.inCachedGuild()) return;

  const member = interaction.options.getMember('user');
  const days = interaction.options.getNumber('date') ?? 0;
  const hours = interaction.options.getNumber('hour') ?? 0;
  const minutes = interaction.options.getNumber('minute') ?? 0;
  const duration = Math.round(((days * 24 + hours) * 60 + minutes) * Minute);

  if (duration < Minute)
    return reply(interaction, errorMessage('合計時間は1分以上から設定できます'));
  if (duration > MaxDuration)
    return reply(interaction, errorMessage('28日を超えるタイムアウトはできません'));
  if (!member) return reply(interaction, errorMessage('このユーザーはサーバーにいません'));
  if (member.user.equals(interaction.user))
    return reply(interaction, errorMessage('自分自身を対象にすることはできません'));
  if (
    !member.moderatable ||
    (interaction.guild.ownerId !== interaction.user.id &&
      interaction.member.roles.highest.position <= member.roles.highest.position)
  )
    return reply(interaction, errorMessage('このユーザーをタイムアウトする権限がありません'));

  const reason = interaction.options.getString('reason') ?? '理由が入力されていません';
  const result = await member
    .timeout(duration, `${reason} - ${interaction.user.username}`)
    .catch(() => null);

  if (!result) return reply(interaction, errorMessage('タイムアウトに失敗しました'));

  const d = Math.floor(duration / (24 * 60 * Minute));
  const h = Math.floor(duration / (60 * Minute)) % 24;
  const m = Math.floor(duration / Minute) % 60;
  interaction.reply({
    content: successMessage(
      `${member}を${inlineCode(String(d))}日${inlineCode(String(h))}時間${inlineCode(String(m))}分タイムアウトしました`,
    ),
    allowedMentions: { users: [] },
    flags: [MessageFlags.Ephemeral],
  });
});
