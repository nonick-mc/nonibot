ALTER TABLE "public_setting"."auto_change_verify_level" ADD COLUMN "default_level" integer;--> statement-breakpoint
ALTER TABLE "guild" DROP COLUMN "before_verify_level";
