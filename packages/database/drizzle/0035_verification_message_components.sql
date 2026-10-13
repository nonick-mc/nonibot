ALTER TYPE "public"."action_type" ADD VALUE 'send_verification_panel';--> statement-breakpoint
ALTER TABLE "public_setting"."verification" ADD COLUMN "message_components" jsonb[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."verification" ADD COLUMN "enable_log" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."verification" ADD COLUMN "log_channel" text;--> statement-breakpoint
ALTER TABLE "public_setting"."verification" ADD COLUMN "log_types" text[] DEFAULT '{"success","failure"}' NOT NULL;--> statement-breakpoint
UPDATE "public_setting"."verification" SET "message_components" = ARRAY['{"type":17,"accent_color":5763719,"components":[{"type":10,"content":"### 認証"},{"type":10,"content":"下の「認証」ボタンを押して認証を行ってください。\n認証が完了すると {{role}} が付与されます。"},{"type":1,"components":[{"type":2,"style":3,"label":"認証","custom_id":"verification:verify"}]}]}'::jsonb];
