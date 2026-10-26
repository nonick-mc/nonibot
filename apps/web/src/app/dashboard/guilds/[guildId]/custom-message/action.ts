'use server';

import { auditLog } from '@repo/database';
import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord-api-types/v10';
import { db } from '@/lib/db';
import { createChannelMessage, getChannels } from '@/lib/discord/api';
import { hasPermission } from '@/lib/discord/utils';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { sendFormSchema } from './schema';

export const sendMessageAction = guildActionClient
  .inputSchema(sendFormSchema)
  .action(
    async ({
      parsedInput: { channelId, components },
      bindArgsParsedInputs: [guildId],
      ctx: { session },
    }) => {
      const channels = await getChannels(guildId);
      const channel = channels.find((ch) => ch.id === channelId);
      if (
        channel?.type !== ChannelType.GuildText &&
        channel?.type !== ChannelType.GuildAnnouncement
      ) {
        throw new ActionClientError('送信先のチャンネルが無効です。');
      }
      if (!hasPermission(channel.bot_permissions, PermissionFlagsBits.SendMessages)) {
        throw new ActionClientError('nonibotにこのチャンネルへの送信権限がありません。');
      }

      await createChannelMessage(guildId, channelId, {
        components,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {
        throw new ActionClientError(
          'メッセージを送信できませんでした。nonibotの権限を確認してください。',
        );
      });

      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_message',
        actionType: 'send_custom_message',
        after: { channelId, components },
      });
    },
  );
