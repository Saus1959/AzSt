import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Все страницы кроме /login требуют валидный токен. API защищён отдельно (lib/api.js).
export async function middleware(req) {
  if (req.nextUrl.pathname === '/login') return NextResponse.next();
  const token = req.cookies.get('token')?.value;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
export const config = { matcher: ['/((?!api|_next|favicon.ico).*)'] };
