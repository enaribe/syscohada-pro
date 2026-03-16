import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicPaths = ['/login', '/register', '/onboarding', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ??
    request.cookies.get('__Secure-better-auth.session_token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
}
