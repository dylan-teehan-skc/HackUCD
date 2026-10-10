import { cookies } from "next/headers"
import type { Session } from "./types"

// ponytail: mock session in an httpOnly cookie for the hackathon.
// Swap for Supabase: `createServerClient(...).auth.getUser()` + profiles row (see docs/DECISIONS.md).
export const SESSION_COOKIE = "margin_session"

export function parseSession(raw: string | undefined): Session | null {
  try { return raw ? (JSON.parse(raw) as Session) : null } catch { return null }
}

export async function getSession() {
  return parseSession((await cookies()).get(SESSION_COOKIE)?.value)
}

export async function setSession(s: Session) {
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(s), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE)
}
