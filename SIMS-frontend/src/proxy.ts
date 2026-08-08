import { NextResponse } from 'next/server';

import { ROUTES } from '@/constants';
import { getHomeByRole, hasRoleAccess, isAuthOnlyRoute, isProtectedRoute, isPublicRoute } from '@/features/auth/utils';

import type { NextRequest } from 'next/server';

function getSessionFromRequest(request: NextRequest) {
  const sessionCookie = request.cookies.get('examsphere_session');
  if (!sessionCookie?.value) return null;

  try {
    const decoded = JSON.parse(sessionCookie.value) as {
      userId?: string;
      role?: string;
      exp?: number;
      rememberMe?: boolean;
    };

    if (!decoded.role || !decoded.exp || Date.now() > decoded.exp) {
      return null;
    }

    return {
      role: decoded.role.toLowerCase() as 'admin' | 'lecturer' | 'student',
      expiresAt: decoded.exp,
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = getSessionFromRequest(request);
  const isPublic = isPublicRoute(pathname);
  const isProtected = isProtectedRoute(pathname);
  const isAuthOnly = isAuthOnlyRoute(pathname);

  if (isProtected && !session) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && session) {
    const home = getHomeByRole(session.role);
    if (home !== ROUTES.HOME) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    // If home === ROUTES.HOME, the role is invalid (stale session).
    // Let the request proceed to /login so the client-side code can clear the session.
  }

  if (session && isProtected && !hasRoleAccess(session.role, pathname)) {
    return NextResponse.redirect(new URL(ROUTES.UNAUTHORIZED, request.url));
  }

  if (isPublic) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|$|login|about|features|contact|privacy|terms).*)',
  ],
};
