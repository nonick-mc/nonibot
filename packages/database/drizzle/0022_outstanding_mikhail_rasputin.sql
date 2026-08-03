ALTER TABLE "public_setting"."join_message" ALTER COLUMN "send_trigger" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."send_trigger";--> statement-breakpoint
CREATE TYPE "public"."send_trigger" AS ENUM('joined', 'passedMembershipGate');--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ALTER COLUMN "send_trigger" SET DATA TYPE "public"."send_trigger" USING "send_trigger"::"public"."send_trigger";--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ADD COLUMN "message_components" jsonb[];--> statement-breakpoint
ALTER TABLE "public_setting"."leave_message" ADD COLUMN "message_components" jsonb[];--> statement-breakpoint
UPDATE "public_setting"."join_message" SET "message_components" = ARRAY[
	jsonb_build_object(
		'type', 10,
		'content', '### ' || regexp_replace(coalesce("message"->0->>'title', ''), '!\[([^\]]+)\]', '{{\1}}', 'g')
	),
	jsonb_build_object(
		'type', 10,
		'content', regexp_replace(coalesce("message"->0->>'description', ''), '!\[([^\]]+)\]', '{{\1}}', 'g')
	)
]::jsonb[];--> statement-breakpoint
UPDATE "public_setting"."leave_message" SET "message_components" = ARRAY[
	jsonb_build_object(
		'type', 10,
		'content', '### ' || regexp_replace(coalesce("message"->0->>'title', ''), '!\[([^\]]+)\]', '{{\1}}', 'g')
	),
	jsonb_build_object(
		'type', 10,
		'content', regexp_replace(coalesce("message"->0->>'description', ''), '!\[([^\]]+)\]', '{{\1}}', 'g')
	)
]::jsonb[];--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ALTER COLUMN "message_components" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."leave_message" ALTER COLUMN "message_components" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" DROP COLUMN "message";--> statement-breakpoint
ALTER TABLE "public_setting"."leave_message" DROP COLUMN "message";
