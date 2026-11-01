import { type NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const guildId = request.nextUrl.searchParams.get('guild_id');
  const redirectPath = guildId ? `/dashboard/guilds/${guildId}` : '/dashboard';
  return NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
}
