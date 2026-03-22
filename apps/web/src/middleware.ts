import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Fully public routes — never redirect
  const publicRoutes = ['/playground', '/login', '/register', '/share', '/auth'];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) {
    // If logged in and hitting login/register, redirect to dashboard
    if (
      accessToken &&
      (pathname.startsWith('/login') || pathname.startsWith('/register'))
    ) {
      return NextResponse.redirect(new URL('/workspace', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  const protectedRoutes = ['/workspace', '/request', '/collections', '/history'];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/playground', request.url));
    }
    return NextResponse.next();
  }

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/workspace', request.url));
    }
    return NextResponse.redirect(new URL('/playground', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
};
