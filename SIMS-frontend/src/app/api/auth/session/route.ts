import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const payload = {
    userId: body.userId,
    role: body.role,
    exp: body.exp,
    rememberMe: body.rememberMe,
  };

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'examsphere_session',
    value: JSON.stringify(payload),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'examsphere_session',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
