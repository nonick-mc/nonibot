ALTER TABLE "public_setting"."join_message" ADD COLUMN "dm_enabled" boolean;--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ADD COLUMN "dm_message_components" jsonb[];--> statement-breakpoint
UPDATE "public_setting"."join_message" SET "dm_enabled" = false, "dm_message_components" = ARRAY[
	jsonb_build_object(
		'type', 17,
		'components', jsonb_build_array(
			jsonb_build_object(
				'type', 10,
				'content', '### WELCOME'
			),
			jsonb_build_object(
				'type', 10,
				'content', '{{user}} **({{userName}})** さん、**{{serverName}}**へようこそ！'
			)
		),
		'accent_color', 5763719
	)
]::jsonb[];--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ALTER COLUMN "dm_enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_setting"."join_message" ALTER COLUMN "dm_message_components" SET NOT NULL;
