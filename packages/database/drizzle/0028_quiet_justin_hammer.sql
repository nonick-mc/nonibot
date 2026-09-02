ALTER TABLE "public_setting"."report" ADD COLUMN "user_categories" jsonb[];--> statement-breakpoint
UPDATE "public_setting"."report" SET "user_categories" = '{}';--> statement-breakpoint
ALTER TABLE "public_setting"."report" ALTER COLUMN "user_categories" SET NOT NULL;