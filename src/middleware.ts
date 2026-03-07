import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('persis_session');

    // Allow access to login or activate pages if no session
    if (!sessionCookie && !['/login', '/activate'].includes(request.nextUrl.pathname)) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if logged in and trying to view auth pages (except activate)
    if (sessionCookie && ['/login'].includes(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/', request.url))
    }
}

export const config = {
    // Apply middleware to all routes except API calls, Next.js static files, and images
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
