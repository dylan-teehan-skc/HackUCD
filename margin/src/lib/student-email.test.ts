import { test } from "node:test"
import assert from "node:assert/strict"
import { universityFor } from "./student-email.ts"

test("only student domains pass", () => {
  assert.equal(universityFor("23365498@studentmail.ul.ie"), "UL")
  assert.equal(universityFor("  Jane.Doe@UCDConnect.ie "), "UCD")
  assert.equal(universityFor("jane@gmail.com"), null)
  assert.equal(universityFor("jane@ucdconnect.ie.evil.com"), null)
  assert.equal(universityFor("jane@evil-ucdconnect.ie"), null)
  assert.equal(universityFor("not-an-email"), null)
})
