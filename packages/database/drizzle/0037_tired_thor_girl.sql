ALTER TABLE "public_setting"."auto_change_verify_level" ADD COLUMN "default_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "public_setting"."auto_change_verify_level" AS s SET "default_level" = g."before_verify_level" FROM "guild" AS g WHERE g."id" = s."guild_id" AND g."before_verify_level" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."auto_change_verify_level" ALTER COLUMN "default_level" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guild" DROP COLUMN "before_verify_level";
