// Single source of truth for routes, so pages and API handlers line up (see docs/DECISIONS.md).
export const routes = {
  home: "/",
  login: "/login",
  library: "/modules",
  module: (code: string) => `/m/${code}`,
  note: (id: string) => `/n/${id}`,
  condense: "/condense",
} as const

// ponytail: demo numbers, replace with a count query on notes/modules/stars once Supabase is wired.
export const stats = [
  { value: "1,240", label: "Notes" },
  { value: "86", label: "Modules" },
  { value: "9.1K", label: "Stars" },
]
