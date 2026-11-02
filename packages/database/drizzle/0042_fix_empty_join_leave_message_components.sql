UPDATE "public_setting"."join_message"
SET "message_components" = ARRAY['{"type":17,"accent_color":5763719,"components":[{"type":10,"content":"### WELCOME"},{"type":10,"content":"{{user}} **({{userName}})** さん、**{{serverName}}**へようこそ！"}]}'::jsonb]
WHERE "message_components" = ARRAY['{"type":10,"content":"### "}'::jsonb, '{"type":10,"content":""}'::jsonb];
--> statement-breakpoint
UPDATE "public_setting"."join_message"
SET "dm_message_components" = ARRAY['{"type":17,"accent_color":5763719,"components":[{"type":10,"content":"### WELCOME"},{"type":10,"content":"{{user}} **({{userName}})** さん、**{{serverName}}**へようこそ！"}]}'::jsonb]
WHERE "dm_message_components" = ARRAY['{"type":10,"content":"### "}'::jsonb, '{"type":10,"content":""}'::jsonb];
--> statement-breakpoint
UPDATE "public_setting"."leave_message"
SET "message_components" = ARRAY['{"type":10,"content":"**{{userName}}** さんがサーバーを退室しました👋"}'::jsonb]
WHERE "message_components" = ARRAY['{"type":10,"content":"### "}'::jsonb, '{"type":10,"content":""}'::jsonb];
