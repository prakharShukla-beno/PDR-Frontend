import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/forgot-password", "/reset-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes are proxied to the backend — never auth-gate them here
  if (pathname.startsWith("/api") || pathname === "/health") {
    return NextResponse.next()
  }

  const token = request.cookies.get("beno_token")?.value

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.png|.*\\.svg).*)",
  ],
}