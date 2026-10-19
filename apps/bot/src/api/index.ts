import { serve } from '@hono/node-server';
import type { Client } from 'discord.js';
import pc from 'picocolors';
import { createApp } from './app';

/** ダッシュボード向けの内部APIサーバーを起動 */
export function startApi(client: Client<true>) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) throw new Error('INTERNAL_API_SECRET is not set');

  const port = Number(process.env.INTERNAL_API_PORT ?? 3001);

  return serve({ fetch: createApp(client, secret).fetch, port, hostname: '::' }, () => {
    console.log(pc.green('✓'), 'Internal API started', pc.gray(`(port ${port})`));
  });
}
