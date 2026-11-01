ALTER TABLE "public_setting"."report" RENAME COLUMN "categories" TO "message_categories";--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "target_channel_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "target_message_id" DROP NOT NULL;