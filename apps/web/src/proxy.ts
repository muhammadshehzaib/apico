import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Fully public routes — never redirect
  const publicRoutes = ['/playground', '/login', '/register', '/share'];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) {
    // If logged in and hitting login/register, redirect to app
    if (
      accessToken &&
      (pathname.startsWith('/login') || pathname.startsWith('/register'))
    ) {
      return NextResponse.redirect(new URL('/app/workspace', request.url));
    }
    return NextResponse.next();
  }

  // Protect /app/* routes
  if (pathname.startsWith('/app')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/playground', request.url));
    }
    return NextResponse.next();
  }

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/app/workspace', request.url));
    }
    return NextResponse.redirect(new URL('/playground', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
};
