import { cookies } from "next/headers"
import type { Session } from "./types"

// ponytail: mock session in an httpOnly cookie for the hackathon.
// Swap for Supabase: `createServerClient(...).auth.getUser()` + enrollments table (see docs/DECISIONS.md).
const COOKIE = "margin_session"

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  try {
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, JSON.stringify(s), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
}
