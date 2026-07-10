import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'sc_session';

export function middleware(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/((?!login).*)'],
};
