CREATE TYPE "public"."thread_state" AS ENUM('open', 'archived', 'locked', 'archived_locked');--> statement-breakpoint
ALTER TABLE "public_rule"."auto_create_thread" ADD COLUMN "initial_thread_state" "thread_state" DEFAULT 'open' NOT NULL;
--> statement-breakpoint
-- プレースホルダー記法を旧版(!+[])から現行版({{}})の仕様へ移行
UPDATE "public_rule"."auto_create_thread" SET "thread_name" = regexp_replace("thread_name", '!\[displayName\]', '{{userDisplayName}}', 'g');
--> statement-breakpoint
UPDATE "public_rule"."auto_create_thread" SET "thread_name" = regexp_replace("thread_name", '!\[username\]', '{{userName}}', 'g');
--> statement-breakpoint
UPDATE "public_rule"."auto_create_thread" SET "thread_name" = regexp_replace("thread_name", '!\[globalName\]', '{{userGlobalName}}', 'g');
--> statement-breakpoint
UPDATE "public_rule"."auto_create_thread" SET "thread_name" = regexp_replace("thread_name", '!\[createdAt_date\]', '{{createdAtDate}}', 'g');
--> statement-breakpoint
UPDATE "public_rule"."auto_create_thread" SET "thread_name" = regexp_replace("thread_name", '!\[createdAt_time\]', '{{createdAtTime}}', 'g');
--> statement-breakpoint
UPDATE "public_rule"."auto_create_thread" SET "thread_name" = regexp_replace("thread_name", '!\[createdAt\]', '{{createdAt}}', 'g');