import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip middleware for the login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for admin token
    const adminToken = request.cookies.get('admin_token');

    if (!adminToken || adminToken.value !== 'authenticated') {
      // Redirect to login if not authenticated
      // Use the origin from the request to ensure we have a valid URL
      const url = new URL('/admin/login', request.nextUrl.origin);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}; 