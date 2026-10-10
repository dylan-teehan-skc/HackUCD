import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

// ponytail: local scrypt hashing for the mock users table. Supabase Auth does this for us once wired.
const scryptAsync = promisify(scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>
export const MIN_PASSWORD = 8

export async function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex")
  return `${salt}:${(await scryptAsync(pw, salt, 64)).toString("hex")}`
}

export async function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const got = await scryptAsync(pw, salt, 64)
  const want = Buffer.from(hash, "hex")
  return want.length === got.length && timingSafeEqual(got, want)
}
