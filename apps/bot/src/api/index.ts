import { serve } from '@hono/node-server';
import type { Client } from 'discord.js';
import pc from 'picocolors';
import { createApp } from './app';

export function assertApiEnv() {
  if (!process.env.INTERNAL_API_SECRET) throw new Error('INTERNAL_API_SECRET is not set');
}

/** ダッシュボード向けの内部APIサーバーを起動 */
export function startApi(client: Client<true>) {
  assertApiEnv();
  const secret = process.env.INTERNAL_API_SECRET as string;

  const port = Number(process.env.INTERNAL_API_PORT ?? 3001);
  const hostname = process.env.INTERNAL_API_HOST ?? '127.0.0.1';

  const server = serve({ fetch: createApp(client, secret).fetch, port, hostname }, () => {
    console.log(pc.green('✓'), 'Internal API started', pc.gray(`(${hostname}:${port})`));
  });

  server.on('error', (error) => {
    console.error(pc.red('✗'), `Internal API failed to listen on ${hostname}:${port}`, error);
    process.exit(1);
  });

  return server;
}
