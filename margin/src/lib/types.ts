// Row types mirror the SQL in ../BACKEND_PLAN.md (snake_case), so Supabase results need no mapping.
export type Module = { id: string; code: string; name: string; school: string }

export type Session = { email: string; university: string; module_codes: string[] }
