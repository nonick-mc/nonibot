import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);

  // セッションが存在しない場合はログイン画面にリダイレクト
  if (!sessionCookie) {
    const loginPageUrl = new URL('/login', req.url);
    loginPageUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginPageUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
