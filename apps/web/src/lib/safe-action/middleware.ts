import 'server-only';

import { createMiddleware } from 'next-safe-action';
import { canAccessDashboard, getCachedSession } from '../dal';
import { SnowflakeRegex } from '../discord/zod';
import rateLimit from '../rate-limit';
import { ActionClientError } from './error';

const limiter = rateLimit({
  interval: 10 * 1000, // 10秒
});

export const authMiddleware = createMiddleware().define(async ({ next }) => {
  const session = await getCachedSession();
  if (!session) throw new ActionClientError('Unauthorized');

  try {
    await limiter.check(5, session.user.id);
  } catch {
    throw new ActionClientError('Too Many Requests');
  }

  return next({ ctx: { session } });
});

export const guildPermissionMiddleware = createMiddleware().define(
  async ({ next, ctx, bindArgsClientInputs }) => {
    const [guildId] = bindArgsClientInputs as [string];

    if (typeof guildId !== 'string' || !SnowflakeRegex.test(guildId)) {
      throw new ActionClientError('Missing Permission');
    }

    const hasPermission = await canAccessDashboard(guildId);
    if (!hasPermission) throw new ActionClientError('Missing Permission');

    return next({ ctx });
  },
);
