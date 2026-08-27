ALTER TABLE "public_setting"."report" ALTER COLUMN "channel" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."report" ADD COLUMN "enabled" boolean;--> statement-breakpoint
ALTER TABLE "public_setting"."report" ADD COLUMN "categories" jsonb[];--> statement-breakpoint
UPDATE "public_setting"."report" SET "enabled" = true;--> statement-breakpoint
UPDATE "public_setting"."report" SET "mention_roles" = '{}' WHERE "enable_mention" = false;--> statement-breakpoint
UPDATE "public_setting"."report" SET "categories" = '{}';--> statement-breakpoint
ALTER TABLE "public_setting"."report" ALTER COLUMN "enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."report" ALTER COLUMN "categories" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."report" DROP COLUMN "enable_mention";
