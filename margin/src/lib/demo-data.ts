import type { Module } from "./types"

// ponytail: synthetic module seed data (labelled demo) for a few courses; any other course
// lets the student type their own module codes. Becomes the `modules` table once Supabase is wired.
const cs: Module[] = [
  { code: "COMP10010", name: "Introduction to Programming I", school: "Computer Science" },
  { code: "COMP20230", name: "Data Structures & Algorithms", school: "Computer Science" },
  { code: "COMP30220", name: "Distributed Systems", school: "Computer Science" },
  { code: "COMP30680", name: "Web Application Development", school: "Computer Science" },
  { code: "COMP30760", name: "Machine Learning", school: "Computer Science" },
  { code: "STAT20060", name: "Statistics & Probability", school: "Mathematics & Statistics" },
]
const business: Module[] = [
  { code: "ACC10010", name: "Introduction to Accounting", school: "Business" },
  { code: "FIN20030", name: "Corporate Finance", school: "Business" },
  { code: "MKT20010", name: "Marketing Fundamentals", school: "Business" },
  { code: "MIS30040", name: "Business Analytics", school: "Business" },
]
const law: Module[] = [
  { code: "LAW10010", name: "Constitutional Law", school: "Law" },
  { code: "LAW10020", name: "Contract Law", school: "Law" },
  { code: "LAW20030", name: "Criminal Law", school: "Law" },
]
const econ: Module[] = [
  { code: "ECON10010", name: "Introduction to Economics", school: "Economics" },
  { code: "ECON20020", name: "Intermediate Microeconomics", school: "Economics" },
  { code: "ECON30150", name: "Econometrics", school: "Economics" },
]

export const courseModules: Record<string, Module[]> = {
  "Computer Science": cs,
  "Computer Science with Data Science": cs,
  "Computer Science with Cybersecurity": cs,
  "Bachelor of Commerce": business,
  "Commerce International": business,
  "Law (BCL)": law,
  "Economics": econ,
  "Economics & Finance": [...econ, business[1]],
}

// UCD-style module code: 3–4 letters + 5 digits, e.g. COMP30760.
export const MODULE_CODE = /^[A-Z]{3,4}\d{5}$/

// ponytail: mocked email code (shown on the login screen); Supabase OTP replaces it.
export const DEMO_CODE = "123456"
