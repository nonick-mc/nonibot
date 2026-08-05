ALTER TABLE "public_setting"."join_message" ADD COLUMN "dm_enabled" boolean;--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ADD COLUMN "dm_message_components" jsonb[];--> statement-breakpoint
UPDATE "public_setting"."join_message" SET "dm_enabled" = true, "dm_message_components" = ARRAY[]::jsonb[];--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ALTER COLUMN "dm_enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ALTER COLUMN "dm_message_components" SET NOT NULL;
