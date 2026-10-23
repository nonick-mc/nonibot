ALTER TABLE "public_setting"."message_expand" ADD COLUMN "only_own_guild" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."message_expand" ALTER COLUMN "only_own_guild" DROP DEFAULT;
