import { NextResponse, type NextRequest } from "next/server"
import { parseSession, SESSION_COOKIE } from "@/lib/session"

// Signed-in (and signed-up) students only. Anyone else goes to /login and comes back after.
const PROTECTED = ["/modules", "/m/", "/n/", "/condense", "/favourites", "/me"]

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const signedIn = !!parseSession(req.cookies.get(SESSION_COOKIE)?.value)?.profile
  // Signed-in students never see the login page, like any other site.
  if (path === "/login") return signedIn ? NextResponse.redirect(new URL("/modules", req.nextUrl)) : undefined
  if (!PROTECTED.some((p) => path === p || path.startsWith(p))) return
  if (signedIn) return
  const url = new URL("/login", req.nextUrl)
  url.searchParams.set("next", path)
  return NextResponse.redirect(url)
}

export const config = { matcher: ["/login", "/modules", "/m/:path*", "/n/:path*", "/condense", "/favourites", "/me"] }
