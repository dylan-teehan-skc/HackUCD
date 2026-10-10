// Only student university emails can sign in. Checked on the server (trust boundary), shown on the client.
export const STUDENT_DOMAINS: Record<string, string> = {
  "ucdconnect.ie": "UCD",
  "studentmail.ul.ie": "UL",
  "tcd.ie": "Trinity",
  "mail.dcu.ie": "DCU",
  "umail.ucc.ie": "UCC",
  "universityofgalway.ie": "Galway",
}

export function universityFor(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^[^\s@]+@([^\s@]+\.[a-z]+)$/)
  return m ? STUDENT_DOMAINS[m[1]] ?? null : null
}
