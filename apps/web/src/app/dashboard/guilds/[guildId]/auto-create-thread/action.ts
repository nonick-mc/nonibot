'use server';

import { auditLog, autoCreateThreadRule } from '@repo/database';
import { ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { type ZodString, z } from 'zod';
import { db } from '@/lib/db';
import { SnowflakeRegex } from '@/lib/discord/zod';
import { guildActionClient } from '@/lib/safe-action/client';
import { ActionClientError } from '@/lib/safe-action/error';
import { RulesMaxSize } from './constants';
import { createRuleFormSchema, updateRuleFormSchema } from './schema';

export const createRuleAction = guildActionClient
  .inputSchema(createRuleFormSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId], ctx: { session } }) => {
    const currentCount = await db.$count(
      autoCreateThreadRule,
      eq(autoCreateThreadRule.guildId, guildId),
    );

    if (currentCount >= RulesMaxSize) {
      throw new ActionClientError('チャンネルの登録上限数に達しています。');
    }

    const [newRule] = await db
      .insert(autoCreateThreadRule)
      .values({
        guildId,
        channelId: parsedInput.channelId,
        enabled: false,
        threadName: '{{userDisplayName}}のスレッド',
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        initialThreadState: 'open',
        ignoreBot: true,
        ignoreRoles: [],
      })
      .returning();

    await db.insert(auditLog).values({
      guildId,
      authorId: session.user.id,
      targetName: 'auto_create_thread',
      actionType: 'create_rule',
      after: newRule,
    });

    revalidatePath(`/dashboard/guilds/${guildId}/auto-create-thread`, 'layout');
  });

export const updateRuleAction = guildActionClient
  .bindArgsSchemas<[guildId: ZodString, channelId: ZodString]>([
    z.string().regex(SnowflakeRegex),
    z.string().regex(SnowflakeRegex),
  ])
  .inputSchema(updateRuleFormSchema)
  .action(async ({ parsedInput, bindArgsParsedInputs: [guildId, channelId], ctx: { session } }) => {
    const beforeRule = await db.query.autoCreateThreadRule.findFirst({
      where: (rule, { eq, and }) => and(eq(rule.guildId, guildId), eq(rule.channelId, channelId)),
    });
    if (!beforeRule) throw new ActionClientError('ルールが見つかりません。');

    const [afterRule] = await db
      .update(autoCreateThreadRule)
      .set(parsedInput)
      .where(
        and(
          eq(autoCreateThreadRule.guildId, guildId),
          eq(autoCreateThreadRule.channelId, channelId),
        ),
      )
      .returning();

    await db.insert(auditLog).values({
      guildId,
      authorId: session.user.id,
      targetName: 'auto_create_thread',
      actionType: 'update_rule',
      before: beforeRule,
      after: afterRule,
    });

    revalidatePath(`/dashboard/guilds/${guildId}/auto-create-thread`, 'layout');
  });

export const deleteRuleAction = guildActionClient
  .bindArgsSchemas<[guildId: ZodString, channelId: ZodString]>([
    z.string().regex(SnowflakeRegex),
    z.string().regex(SnowflakeRegex),
  ])
  .action(async ({ bindArgsParsedInputs: [guildId, channelId], ctx: { session } }) => {
    const beforeRule = await db.query.autoCreateThreadRule.findFirst({
      where: (rule, { eq, and }) => and(eq(rule.guildId, guildId), eq(rule.channelId, channelId)),
    });
    if (!beforeRule) throw new ActionClientError('ルールが見つかりません。');

    await db
      .delete(autoCreateThreadRule)
      .where(
        and(
          eq(autoCreateThreadRule.guildId, guildId),
          eq(autoCreateThreadRule.channelId, channelId),
        ),
      );

    await db.insert(auditLog).values({
      guildId,
      authorId: session.user.id,
      targetName: 'auto_create_thread',
      actionType: 'delete_rule',
      before: beforeRule,
    });

    revalidatePath(`/dashboard/guilds/${guildId}/auto-create-thread`, 'layout');
  });
