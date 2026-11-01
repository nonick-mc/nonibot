ALTER TABLE "public_setting"."auto_public" ADD COLUMN "react_on_failure" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."auto_public" ADD COLUMN "ignore_roles" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."auto_public" ADD COLUMN "ignore_webhooks" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."auto_public" ALTER COLUMN "react_on_failure" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public_setting"."auto_public" ALTER COLUMN "ignore_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public_setting"."auto_public" ALTER COLUMN "ignore_webhooks" DROP DEFAULT;
