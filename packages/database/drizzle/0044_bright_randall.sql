ALTER TABLE "public_setting"."level" ADD COLUMN "role_rewards" jsonb[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."level" ALTER COLUMN "role_rewards" DROP DEFAULT;
