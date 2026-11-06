CREATE TYPE "public"."level_notify_mode" AS ENUM('sameChannel', 'fixedChannel', 'none');--> statement-breakpoint
ALTER TYPE "public"."target_name" ADD VALUE 'level' BEFORE 'verification';--> statement-breakpoint
CREATE TABLE "member_level" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"lv" integer NOT NULL,
	"xp" integer NOT NULL,
	"last_gained_at" timestamp with time zone NOT NULL,
	CONSTRAINT "member_level_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "public_setting"."level" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean NOT NULL,
	"notify_mode" "level_notify_mode" NOT NULL,
	"notify_channel" text,
	"notify_message_components" jsonb[] NOT NULL,
	"ignore_channels" text[] NOT NULL,
	"ignore_roles" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "member_level" ADD CONSTRAINT "member_level_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_setting"."level" ADD CONSTRAINT "level_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_level_guild_id_rank_idx" ON "member_level" USING btree ("guild_id","lv" DESC NULLS LAST,"xp" DESC NULLS LAST);