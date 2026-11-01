ALTER TABLE "public_setting"."ban_log" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
ALTER TABLE "public_setting"."kick_log" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
ALTER TABLE "public_setting"."message_delete_log" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
ALTER TABLE "public_setting"."message_edit_log" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
ALTER TABLE "public_setting"."timeout_log" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
ALTER TABLE "public_setting"."voice_log" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
UPDATE "public_setting"."ban_log" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
UPDATE "public_setting"."kick_log" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
UPDATE "public_setting"."message_delete_log" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
UPDATE "public_setting"."message_edit_log" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
UPDATE "public_setting"."timeout_log" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
UPDATE "public_setting"."voice_log" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."ban_log" ALTER COLUMN "ignore_roles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."kick_log" ALTER COLUMN "ignore_roles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."message_delete_log" ALTER COLUMN "ignore_roles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."message_edit_log" ALTER COLUMN "ignore_roles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."timeout_log" ALTER COLUMN "ignore_roles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."voice_log" ALTER COLUMN "ignore_roles" SET NOT NULL;
