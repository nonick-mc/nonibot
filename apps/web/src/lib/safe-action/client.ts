import 'server-only';

import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import pc from 'picocolors';
import { type ZodString, z } from 'zod';
import { SnowflakeRegex } from '../discord/zod';
import { ActionClientError } from './error';
import { authMiddleware, guildPermissionMiddleware } from './middleware';

const baseClient = createSafeActionClient({
  handleServerError: (e) => {
    console.error(pc.red('Server Action Error:'), e.message);
    if (e instanceof ActionClientError) return e.message;
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
})
  .bindArgsSchemas<[guildId: ZodString]>([z.string().regex(SnowflakeRegex)])
  .use(authMiddleware);

export const guildActionClient = baseClient.use(guildPermissionMiddleware);
export const memberActionClient = baseClient;
