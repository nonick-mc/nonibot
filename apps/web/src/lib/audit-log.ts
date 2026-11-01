import 'server-only';

import { auditLog } from '@repo/database';
import type { InferInsertModel } from 'drizzle-orm';
import { db } from './db';

type TargetName = NonNullable<InferInsertModel<typeof auditLog>['targetName']>;

export async function insertSettingAuditLog(params: {
  guildId: string;
  authorId: string;
  targetName: TargetName;
  before: unknown;
  after: unknown;
}) {
  await db.insert(auditLog).values({
    ...params,
    actionType: 'update_guild_setting',
  });
}
