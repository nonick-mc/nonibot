'use server';

import { auditLog, customMessage } from '@repo/database';
import {
  collectInteractiveComponents,
  isAssignableRole,
  parseRoleButtonCustomId,
} from '@repo/shared';
import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord-api-types/v10';
import { and, count, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  createChannelMessage,
  deleteChannelMessage,
  editChannelMessage,
  getChannels,
  getRoles,
} from '@/lib/discord/api';
import { getRoleButtonRules } from '@/lib/discord/role-button';
import { hasPermission } from '@/lib/discord/utils';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import {
  deleteFormSchema,
  editFormSchema,
  maxSavedMessages,
  renameFormSchema,
  sendFormSchema,
} from './schema';

/**
 * ロールボタンにロールを指定できる権限があるか検証
 * `previous`を指定すると、そこに含まれていないボタンだけを検証する。
 */
async function assertAssignableRoleButtons(
  guildId: string,
  discordUserId: string,
  components: unknown,
  previous?: unknown,
) {
  const previousIds = new Set(collectInteractiveComponents(previous).map((c) => c.customId));
  const roleIds = collectInteractiveComponents(components)
    .filter((c) => !previousIds.has(c.customId))
    .flatMap((c) => parseRoleButtonCustomId(c.customId) ?? []);
  if (!roleIds.length) return;

  const [roles, rules] = await Promise.all([
    getRoles(guildId),
    getRoleButtonRules(guildId, discordUserId),
  ]);
  if (!rules) {
    throw new ActionClientError('ロールボタンを設置するには「ロールの管理」権限が必要です。');
  }
  const isValid = roleIds.every((id) => {
    const role = roles.find((r) => r.id === id);
    return role && isAssignableRole(role, rules);
  });
  if (!isValid) throw new ActionClientError('ロールボタンに設定できないロールが含まれています。');
}

const findSavedMessage = async (guildId: string, id: string) => {
  const saved = await db.query.customMessage.findFirst({
    where: and(eq(customMessage.id, id), eq(customMessage.guildId, guildId)),
  });
  if (!saved) throw new ActionClientError('保存されたメッセージが見つかりません。');
  return saved;
};

export const sendMessageAction = guildActionClient
  .inputSchema(sendFormSchema)
  .action(
    async ({
      parsedInput: { channelId, components, name },
      bindArgsParsedInputs: [guildId],
      ctx: { session },
    }) => {
      await assertAssignableRoleButtons(guildId, session.user.discordUserId, components);

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

      if (name) {
        const [{ total }] = await db
          .select({ total: count() })
          .from(customMessage)
          .where(eq(customMessage.guildId, guildId));
        if (total >= maxSavedMessages) {
          throw new ActionClientError(
            `保存できるメッセージは${maxSavedMessages}件までです。不要なメッセージを削除してください。`,
          );
        }
      }

      const message = await createChannelMessage(guildId, channelId, {
        components,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {
        throw new ActionClientError(
          'メッセージを送信できませんでした。nonibotの権限を確認してください。',
        );
      });

      if (name) {
        await db.insert(customMessage).values({
          guildId,
          channelId,
          messageId: message.id,
          name,
          components,
        });
      }

      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_message',
        actionType: 'send_custom_message',
        after: { channelId, messageId: message.id, components },
      });

      revalidatePath('/');
    },
  );

export const editMessageAction = guildActionClient
  .inputSchema(editFormSchema)
  .action(
    async ({
      parsedInput: { id, components },
      bindArgsParsedInputs: [guildId],
      ctx: { session },
    }) => {
      const saved = await findSavedMessage(guildId, id);
      await assertAssignableRoleButtons(
        guildId,
        session.user.discordUserId,
        components,
        saved.components,
      );

      await editChannelMessage(guildId, saved.channelId, saved.messageId, {
        components,
        flags: MessageFlags.IsComponentsV2,
      }).catch((e) => {
        if (e?.status === 404) {
          throw new ActionClientError(
            '元のメッセージが見つかりません。削除された場合は、保存したメッセージを削除してください。',
          );
        }
        throw new ActionClientError('メッセージを編集できませんでした。');
      });

      await db.update(customMessage).set({ components }).where(eq(customMessage.id, id));

      const target = {
        channelId: saved.channelId,
        messageId: saved.messageId,
        name: saved.name,
      };
      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_message',
        actionType: 'update_custom_message',
        before: { ...target, components: saved.components },
        after: { ...target, components },
      });

      revalidatePath('/');
    },
  );

export const renameMessageAction = guildActionClient
  .inputSchema(renameFormSchema)
  .action(
    async ({ parsedInput: { id, name }, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
      const saved = await findSavedMessage(guildId, id);
      await db.update(customMessage).set({ name }).where(eq(customMessage.id, id));

      const target = {
        channelId: saved.channelId,
        messageId: saved.messageId,
        components: saved.components,
      };
      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_message',
        actionType: 'update_custom_message',
        before: { ...target, name: saved.name },
        after: { ...target, name },
      });

      revalidatePath('/');
    },
  );

export const deleteSavedMessageAction = guildActionClient
  .inputSchema(deleteFormSchema)
  .action(
    async ({
      parsedInput: { id, deleteDiscordMessage },
      bindArgsParsedInputs: [guildId],
      ctx: { session },
    }) => {
      const saved = await findSavedMessage(guildId, id);

      if (deleteDiscordMessage) {
        await deleteChannelMessage(guildId, saved.channelId, saved.messageId).catch((e) => {
          if (e?.status === 404) return;
          throw new ActionClientError(
            'Discordのメッセージを削除できませんでした。nonibotの権限を確認してください。',
          );
        });
      }

      await db.delete(customMessage).where(eq(customMessage.id, id));

      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_message',
        actionType: 'delete_custom_message',
        before: {
          channelId: saved.channelId,
          messageId: saved.messageId,
          name: saved.name,
          components: saved.components,
        },
      });

      revalidatePath('/');
    },
  );
