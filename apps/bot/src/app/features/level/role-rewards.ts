import type { LevelRoleReward } from '@repo/database';
import type { GuildMember } from 'discord.js';

/**
 * レベルが上がった場合は`before`より高く`after`以下の報酬をレベルの低い順に反映し、
 * 下がった場合は`after`より高く`before`以下の報酬を高い順に取り消す
 */
export function getRewardedRoles(
  current: Iterable<string>,
  rewards: LevelRoleReward[],
  before: number,
  after: number,
) {
  const sorted = [...rewards].sort((a, b) => a.level - b.level);
  const roles = new Set(current);
  const up = after > before;
  const [low, high] = up ? [before, after] : [after, before];
  const targets = sorted.map((reward, i) => ({ reward, prev: sorted[i - 1] }));
  for (const { reward, prev } of up ? targets : targets.reverse()) {
    if (reward.level <= low || reward.level > high) continue;
    if (up) {
      if (reward.mode === 'replace' && prev) roles.delete(prev.roleId);
      roles.add(reward.roleId);
    } else {
      roles.delete(reward.roleId);
      if (reward.mode === 'replace' && prev) roles.add(prev.roleId);
    }
  }
  return roles;
}

/** レベルが上がったメンバーにロール報酬を付与 */
export async function applyRoleRewards(
  member: GuildMember,
  rewards: LevelRoleReward[],
  before: number,
  after: number,
) {
  const current = member.roles.cache.filter((role) => role.id !== member.guild.id);
  const roles = getRewardedRoles(current.keys(), rewards, before, after);
  if (roles.size === current.size && current.every((role) => roles.has(role.id))) return;
  await member.roles.set([...roles], 'ロール報酬').catch(() => null);
}
