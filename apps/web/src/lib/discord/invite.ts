import 'server-only';
import { OAuth2Routes, OAuth2Scopes } from 'discord-api-types/v10';

function buildInviteUrl(params: Record<string, string>) {
  const url = new URL(OAuth2Routes.authorizationURL);
  url.search = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID as string,
    scope: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(' '),
    response_type: 'code',
    redirect_uri: `${process.env.BETTER_AUTH_URL}/api/invite/callback`,
    ...params,
  }).toString();
  return url.toString();
}

export function getInviteUrl() {
  return buildInviteUrl({ permissions: process.env.DISCORD_INVITE_PERMISSION as string });
}

export function getGuildInviteUrl(guildId: string, permissions: bigint[]) {
  return buildInviteUrl({
    permissions: permissions.reduce((acc, v) => acc | v, BigInt(0)).toString(),
    guild_id: guildId,
    disable_guild_select: 'true',
  });
}
