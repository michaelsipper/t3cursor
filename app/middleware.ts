//middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/app/api/middleware/auth';

// Routes that require authentication
const protectedRoutes = ['/profile', '/feed', '/create', '/inbox', '/footprint'];
// Routes that should not be accessible when authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Debugging
  console.log('🔐 Middleware - Path:', pathname);
  console.log('🔐 Middleware - Token:', token ? 'Present' : 'Missing');

  try {
    if (token) {
      // User is authenticated
      if (authRoutes.includes(pathname)) {
        console.log('🔄 Redirecting authenticated user to feed');
        return NextResponse.redirect(new URL('/feed', request.url));
      }
      return NextResponse.next();
    } else {
      // User is not authenticated
      if (protectedRoutes.includes(pathname)) {
        console.log('🔄 Redirecting unauthenticated user to login');
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('🔐 Middleware Error:', error);
    // Token is invalid
    if (protectedRoutes.includes(pathname)) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    return NextResponse.next();
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [...protectedRoutes, ...authRoutes]
};