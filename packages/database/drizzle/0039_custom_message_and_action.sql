ALTER TYPE "public"."action_type" ADD VALUE 'send_custom_message';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'update_custom_message';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'delete_custom_message';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'create_custom_action';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'update_custom_action';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'delete_custom_action';--> statement-breakpoint
ALTER TYPE "public"."target_name" ADD VALUE 'custom_message';--> statement-breakpoint
ALTER TYPE "public"."target_name" ADD VALUE 'custom_action';--> statement-breakpoint
CREATE TABLE "custom_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"steps" jsonb[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "custom_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL,
	"name" text NOT NULL,
	"components" jsonb[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "custom_message_guild_id_message_id_unique" UNIQUE("guild_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "custom_action" ADD CONSTRAINT "custom_action_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_message" ADD CONSTRAINT "custom_message_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;