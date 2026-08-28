ALTER TABLE "public_setting"."report" ADD COLUMN "ignore_roles" text[];--> statement-breakpoint
UPDATE "public_setting"."report" SET "ignore_roles" = '{}' WHERE "ignore_roles" IS NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."report" ALTER COLUMN "ignore_roles" SET NOT NULL;