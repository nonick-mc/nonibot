import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';
import { SnowflakeRegex } from '@/lib/discord/zod';

const guildPathRegex = /^\/dashboard\/guilds\/([^/]+)/;
const verifyPathRegex = /^\/verify\/guilds\/([^/]+)/;

export async function proxy(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);

  // セッションが存在しない場合はログイン画面にリダイレクト
  if (!sessionCookie) {
    const loginPageUrl = new URL('/login', req.url);
    loginPageUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginPageUrl);
  }

  // guildIdがSnowflakeではない場合はサーバー選択画面にリダイレクト
  const guildId = req.nextUrl.pathname.match(guildPathRegex)?.[1];
  if (guildId !== undefined && !SnowflakeRegex.test(guildId)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 認証ページのguildIdがSnowflakeではない場合は404を表示
  const verifyGuildId = req.nextUrl.pathname.match(verifyPathRegex)?.[1];
  if (verifyGuildId !== undefined && !SnowflakeRegex.test(verifyGuildId)) {
    return NextResponse.rewrite(new URL('/404', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/verify/guilds/:path*'],
};
