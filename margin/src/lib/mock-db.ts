import { mkdir, readFile, writeFile } from "node:fs/promises"
import type { Profile } from "./types"

// ponytail: JSON file "users table" for the hackathon. Swap for Supabase Auth (passwords)
// + `profiles` / `enrollments` tables. `profile` is null until sign-up onboarding is finished.
export type UserRow = { password_hash: string; profile: Profile | null }
const FILE = ".data/users.json"

async function all(): Promise<Record<string, UserRow>> {
  try { return JSON.parse(await readFile(FILE, "utf8")) } catch { return {} }
}

export async function findUser(email: string) {
  return (await all())[email] ?? null
}

export async function saveUser(email: string, row: UserRow) {
  const users = await all()
  users[email] = row
  await mkdir(".data", { recursive: true })
  await writeFile(FILE, JSON.stringify(users, null, 2))
}
