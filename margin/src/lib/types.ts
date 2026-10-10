// Row types mirror the SQL in ../../docs/BACKEND_PLAN.md (snake_case), so Supabase results need no mapping.
export type Module = { code: string; name: string; school: string }

export type Profile = {
  email: string
  university: string
  area_id: string // UCD subject area, e.g. "science"
  course: string // UCD course name, e.g. "Computer Science"
  module_codes: string[]
}

// Cookie session. `verified` = email code checked; `profile` = null until sign-up is finished.
export type Session = { email: string; university: string; profile: Profile | null }
