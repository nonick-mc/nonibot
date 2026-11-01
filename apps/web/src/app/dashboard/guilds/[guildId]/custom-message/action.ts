'use server';

import { isDeepStrictEqual } from 'node:util';
import { auditLog, customAction, customMessage } from '@repo/database';
import { collectInteractiveComponents, parseCustomActionCustomId } from '@repo/shared';
import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord-api-types/v10';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  createChannelMessage,
  deleteChannelMessage,
  editChannelMessage,
  getChannels,
} from '@/lib/discord/api';
import { hasPermission } from '@/lib/discord/utils';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { deleteFormSchema, maxSavedMessages, sendFormSchema, updateFormSchema } from './schema';

/**
 * ボタンのカスタムアクションが、このサーバーに存在するか検証する。
 * `previous`を指定すると、そこに含まれていないボタン(新しく追加・変更されたボタン)だけを検証する。
 */
async function assertCustomActionsExist(guildId: string, components: unknown, previous?: unknown) {
  const previousIds = new Set(collectInteractiveComponents(previous).map((c) => c.customId));
  const actionIds = collectInteractiveComponents(components)
    .filter((c) => !previousIds.has(c.customId))
    .flatMap((c) => parseCustomActionCustomId(c.customId) ?? []);
  if (!actionIds.length) return;

  const found = await db.query.customAction.findMany({
    where: and(eq(customAction.guildId, guildId), inArray(customAction.id, actionIds)),
    columns: { id: true },
  });
  if (!actionIds.every((id) => found.some((a) => a.id === id))) {
    throw new ActionClientError('存在しないカスタムアクションが含まれています。');
  }
}

/** 保存できる件数に空きがあるか確認する */
async function assertSavableMessage(guildId: string, executor: Pick<typeof db, 'select'> = db) {
  const [{ total }] = await executor
    .select({ total: count() })
    .from(customMessage)
    .where(eq(customMessage.guildId, guildId));
  if (total >= maxSavedMessages) {
    throw new ActionClientError(
      `保存できるメッセージは${maxSavedMessages}件までです。不要なメッセージを削除してください。`,
    );
  }
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
      await assertCustomActionsExist(guildId, components);

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

      if (name) await assertSavableMessage(guildId);

      const message = await createChannelMessage(guildId, channelId, {
        components,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {
        throw new ActionClientError(
          'メッセージを送信できませんでした。nonibotの権限を確認してください。',
        );
      });

      if (name) {
        await db
          .transaction(async (tx) => {
            await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${guildId}))`);
            await assertSavableMessage(guildId, tx);
            await tx.insert(customMessage).values({
              guildId,
              channelId,
              messageId: message.id,
              name,
              components,
            });
          })
          .catch(async (error) => {
            await deleteChannelMessage(guildId, channelId, message.id).catch(() => {});
            throw error;
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

export const updateCustomMessage = guildActionClient
  .inputSchema(updateFormSchema)
  .action(
    async ({
      parsedInput: { id, name, components },
      bindArgsParsedInputs: [guildId],
      ctx: { session },
    }) => {
      const saved = await findSavedMessage(guildId, id);

      // 名前だけの変更では、Discordのメッセージを編集しない
      if (!isDeepStrictEqual(components, saved.components)) {
        await assertCustomActionsExist(guildId, components, saved.components);

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
      }

      await db
        .update(customMessage)
        .set({ name, components })
        .where(and(eq(customMessage.id, id), eq(customMessage.guildId, guildId)));

      const target = { channelId: saved.channelId, messageId: saved.messageId };
      await db.insert(auditLog).values({
        guildId,
        authorId: session.user.id,
        targetName: 'custom_message',
        actionType: 'update_custom_message',
        before: { ...target, name: saved.name, components: saved.components },
        after: { ...target, name, components },
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
