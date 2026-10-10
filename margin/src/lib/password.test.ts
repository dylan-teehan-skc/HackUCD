import { test } from "node:test"
import assert from "node:assert/strict"
import { hashPassword, verifyPassword } from "./password.ts"

test("hash round-trips and rejects wrong passwords", async () => {
  const h = await hashPassword("correct horse")
  assert.notEqual(h, await hashPassword("correct horse")) // salted
  assert.equal(await verifyPassword("correct horse", h), true)
  assert.equal(await verifyPassword("wrong horse", h), false)
  assert.equal(await verifyPassword("x", "garbage"), false)
})
