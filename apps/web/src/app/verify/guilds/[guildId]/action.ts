'use server';

import { canAccessVerifyPage, getVerificationSetting } from '@/lib/dal';
import { addGuildMemberRole } from '@/lib/discord/api';
import { memberActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { formSchema } from './schema';

export const verifyAction = memberActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    if (!(await canAccessVerifyPage(guildId))) {
      throw new ActionClientError('認証を行うことができません。');
    }
    if (!(await verifyTurnstileToken(parsedInput.turnstileToken))) {
      throw new ActionClientError('人間であることを確認できませんでした。');
    }

    const setting = await getVerificationSetting(guildId);
    if (!setting?.role) throw new ActionClientError('認証を行うことができません。');

    await addGuildMemberRole(guildId, session.user.discordUserId, setting.role).catch(() => {
      throw new ActionClientError(
        'ロールを付与できませんでした。サーバーの管理者に連絡してください。',
      );
    });
  });
