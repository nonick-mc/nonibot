import 'server-only';

import { betterFetch } from '@better-fetch/fetch';

/** Cloudflare Turnstileのトークンを検証 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRETKEY as string);
  formData.append('response', token);

  const { success } = await betterFetch<{ success: boolean }, false>(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: formData, throw: true, timeout: 5000 },
  );
  return success;
}
