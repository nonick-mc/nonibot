import { OAuth2Routes, OAuth2Scopes } from 'discord-api-types/v10';
import { NextResponse } from 'next/server';

export function GET() {
  const url = new URL(OAuth2Routes.authorizationURL);
  url.search = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID as string,
    scope: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(' '),
    permissions: process.env.DISCORD_INVITE_PERMISSION as string,
    response_type: 'code',
    redirect_uri: `${process.env.BETTER_AUTH_URL}/api/invite/callback`,
  }).toString();
  return NextResponse.redirect(url);
}
