import type { Module } from "./types"

// ponytail: synthetic seed data (labelled demo); becomes `select * from modules` once Supabase is wired.
export const modules: Module[] = [
  { id: "1", code: "COMP30760", name: "Machine Learning", school: "Computer Science" },
  { id: "2", code: "COMP30220", name: "Distributed Systems", school: "Computer Science" },
  { id: "3", code: "COMP30680", name: "Web Application Development", school: "Computer Science" },
  { id: "4", code: "COMP20230", name: "Data Structures & Algorithms", school: "Computer Science" },
  { id: "5", code: "ECON10010", name: "Introduction to Economics", school: "Economics" },
  { id: "6", code: "STAT20060", name: "Statistics & Probability", school: "Mathematics & Statistics" },
]
