'use server';

import { auditLog, verificationSetting } from '@repo/database';
import {
  type PlaceholderParams,
  renderPlaceholders,
  type verificationMessagePlaceholders,
} from '@repo/placeholders';
import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord-api-types/v10';
import { revalidatePath } from 'next/cache';
import { insertSettingAuditLog } from '@/lib/audit-log';
import { db } from '@/lib/db';
import { createChannelMessage, getChannels } from '@/lib/discord/api';
import { hasPermission } from '@/lib/discord/utils';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { formSchema, sendPanelFormSchema } from './schema';

const sendPermission = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;

export const updateSettingAction = guildActionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const before = await db.query.verificationSetting.findFirst({
      where: (setting, { eq }) => eq(setting.guildId, guildId),
    });

    const [after] = await db
      .insert(verificationSetting)
      .values({ guildId, ...parsedInput })
      .onConflictDoUpdate({ target: verificationSetting.guildId, set: parsedInput })
      .returning();

    await insertSettingAuditLog({
      guildId,
      authorId: session.user.id,
      targetName: 'verification',
      before,
      after,
    });

    revalidatePath('/');
  });

/** 保存済みの設定で認証メッセージを送信する */
export const sendPanelAction = guildActionClient
  .inputSchema(sendPanelFormSchema)
  .action(
    async ({ parsedInput: { channelId }, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
      const [setting, channels] = await Promise.all([
        db.query.verificationSetting.findFirst({
          where: (setting, { eq }) => eq(setting.guildId, guildId),
        }),
        getChannels(guildId),
      ]);

      if (!setting?.enabled || !setting.role || !setting.messageComponents.length) {
        throw new ActionClientError('メンバー認証が有効になっていません。');
      }
      const channel = channels.find((ch) => ch.id === channelId);
      if (channel?.type !== ChannelType.GuildText) {
        throw new ActionClientError('送信先のチャンネルが無効です。');
      }
      if (!hasPermission(channel.bot_permissions, sendPermission)) {
        throw new ActionClientError('nonibotにこのチャンネルへの送信権限がありません。');
      }

      await createChannelMessage(channelId, {
        components: renderPlaceholders(setting.messageComponents, {
          role: `<@&${setting.role}>`,
        } satisfies PlaceholderParams<typeof verificationMessagePlaceholders>),
        flags: MessageFlags.IsComponentsV2,
        allowed_mentions: { parse: [] },
      });

      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'verification',
        actionType: 'send_verification_panel',
        after: { channelId },
      });
    },
  );
