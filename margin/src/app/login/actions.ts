"use server"

import { redirect } from "next/navigation"
import { universityFor } from "@/lib/student-email"
import { clearSession, getSession, setSession } from "@/lib/session"
import { findUser, saveUser } from "@/lib/mock-db"
import { hashPassword, verifyPassword, MIN_PASSWORD } from "@/lib/password"
import { DEMO_CODE, MODULE_CODE } from "@/lib/demo-data"
import { areas } from "@/lib/ucd"
import { routes } from "@/lib/site"

// ponytail: mocked auth. Real version:
//   sign up → supabase.auth.signUp({ email, password }) then verifyOtp({ email, token, type: "signup" })
//   log in → supabase.auth.signInWithPassword({ email, password })

export type Mode = "login" | "signup"
type Result = { ok: true; onboarding?: boolean } | { ok: false; error: string }

const clean = (email: string) => email.trim().toLowerCase()
// Only same-site paths, never an external redirect.
const safeNext = (next?: string) => (next?.startsWith("/") && !next.startsWith("//") ? next : routes.library)

export async function logIn(email: string, password: string, next?: string): Promise<Result> {
  const university = universityFor(email)
  if (!university) return { ok: false, error: "Use your student email, e.g. you@ucdconnect.ie" }
  const user = await findUser(clean(email))
  if (!user || !(await verifyPassword(password, user.password_hash)))
    return { ok: false, error: "Email or password is incorrect." }
  await setSession({ email: clean(email), university, profile: user.profile })
  if (!user.profile) return { ok: true, onboarding: true } // signed up but never picked modules
  redirect(safeNext(next))
}

// Sign-up step 1: check email + password, then "send" the verification code.
export async function startSignup(email: string, password: string): Promise<Result> {
  if (!universityFor(email)) return { ok: false, error: "Use your student email, e.g. you@ucdconnect.ie" }
  if (password.length < MIN_PASSWORD) return { ok: false, error: `Password needs at least ${MIN_PASSWORD} characters.` }
  if ((await findUser(clean(email)))?.profile) return { ok: false, error: "You already have an account. Log in instead." }
  return { ok: true }
}

// Sign-up step 2: code proves the email is theirs; only then is the account (hashed password) saved.
export async function verifySignup(email: string, password: string, code: string): Promise<Result> {
  const university = universityFor(email)
  if (!university || password.length < MIN_PASSWORD) return { ok: false, error: "Start again from step 1." }
  if (code !== DEMO_CODE) return { ok: false, error: "That code isn't right. Try again." }
  if ((await findUser(clean(email)))?.profile) return { ok: false, error: "You already have an account. Log in instead." }
  await saveUser(clean(email), { password_hash: await hashPassword(password), profile: null })
  await setSession({ email: clean(email), university, profile: null })
  return { ok: true }
}

export async function completeSignup(areaId: string, course: string, codes: string[], next?: string): Promise<Result> {
  const session = await getSession()
  const user = session && (await findUser(session.email))
  if (!session || !user) redirect(routes.login)
  const area = areas.find((a) => a.id === areaId)
  if (!area || !(area.courses as readonly string[]).includes(course)) return { ok: false, error: "Pick a course from the list." }
  const module_codes = [...new Set(codes.map((c) => c.trim().toUpperCase()))].filter((c) => MODULE_CODE.test(c))
  if (!module_codes.length) return { ok: false, error: "Add at least one module." }
  const profile = { email: session.email, university: session.university, area_id: areaId, course, module_codes }
  await saveUser(session.email, { ...user, profile })
  await setSession({ ...session, profile })
  redirect(safeNext(next))
}

export async function logOut() {
  await clearSession()
  redirect(routes.home)
}
