-- Custom SQL migration file, put your code below! --
UPDATE "user" SET "email" = "discord_user_id" || '@discord.local', "email_verified" = false;