import 'server-only';

import { betterFetch } from '@better-fetch/fetch';

/** Cloudflare Turnstileのトークンを検証 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRETKEY;
  if (!secret) throw new Error('TURNSTILE_SECRETKEY is not set');

  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);

  const { success } = await betterFetch<{ success: boolean }, false>(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: formData, throw: true, timeout: 5000 },
  );
  return success;
}
