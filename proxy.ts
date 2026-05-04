import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isRegisterPage = req.nextUrl.pathname === '/register'

  if (!token && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|api/market|api/purchases|api/search|_next/static|_next/image|favicon.ico).*)'],
}
