"use server"

import { redirect } from "next/navigation"
import { universityFor } from "@/lib/student-email"
import { getSession, setSession } from "@/lib/session"
import { modules } from "@/lib/demo-data"
import { routes } from "@/lib/site"

// ponytail: mocked OTP. Real version = supabase.auth.signInWithOtp({ email }) / verifyOtp({ email, token, type: "email" }).
export const DEMO_CODE = "123456"

type Result = { ok: true; university?: string } | { ok: false; error: string }

export async function sendCode(email: string): Promise<Result> {
  const university = universityFor(email)
  if (!university) return { ok: false, error: "Use your student email, e.g. you@ucdconnect.ie" }
  return { ok: true, university }
}

export async function verifyCode(email: string, code: string): Promise<Result> {
  const university = universityFor(email)
  if (!university) return { ok: false, error: "Use your student email" }
  if (code !== DEMO_CODE) return { ok: false, error: "That code isn't right. Try again." }
  await setSession({ email: email.trim().toLowerCase(), university, module_codes: [] })
  return { ok: true }
}

export async function saveModules(codes: string[]) {
  const session = await getSession()
  if (!session) redirect(routes.login)
  const valid = codes.filter((c) => modules.some((m) => m.code === c))
  await setSession({ ...session, module_codes: valid })
  redirect(routes.library)
}
