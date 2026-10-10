"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { logIn, startSignup, verifySignup, completeSignup, type Mode } from "@/app/login/actions"
import { DEMO_CODE, MODULE_CODE } from "@/lib/demo-data"
import { universityFor } from "@/lib/student-email"
import { cn } from "@/lib/utils"
import type { Module } from "@/lib/types"

type Area = { id: string; name: string; courses: readonly string[] }
type Step = "email" | "code" | "area" | "course" | "modules"
const SIGNUP_STEPS: Step[] = ["email", "code", "area", "course", "modules"]

type Props = { areas: readonly Area[]; courseModules: Record<string, Module[]> }

export function LoginForm({ areas, courseModules }: Props) {
  const params = useSearchParams()
  const next = params.get("next") ?? undefined
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "login")
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [code, setCode] = useState("")
  const [area, setArea] = useState<Area | null>(null)
  const [course, setCourse] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  const [custom, setCustom] = useState("")
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  const uni = universityFor(email)
  const wide = step === "area" || step === "course" || step === "modules"
  const stepLabel = `Step ${SIGNUP_STEPS.indexOf(step) + 1} of ${SIGNUP_STEPS.length}`
  const allCourses: Area = { id: "all", name: "Not sure? Search all courses", courses: [...new Set(areas.flatMap((a) => a.courses))].sort() }
  const suggested = courseModules[course] ?? []
  const courses = (area?.courses ?? []).filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  type R = { ok: boolean; error?: string; onboarding?: boolean } | void
  const run = (fn: () => Promise<R>, onOk?: (r: R) => void) =>
    start(async () => {
      setError("")
      const r = await fn()
      if (r && !r.ok) setError(r.error ?? "Something went wrong")
      else onOk?.(r)
    })

  // Back to step 1 with the email kept, so it can be edited.
  const changeEmail = () => { setStep("email"); setCode(""); setPassword(""); setArea(null); setCourse(""); setPicked([]); setError("") }
  const go = (s: Step) => { setQuery(""); setError(""); setStep(s) }
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  const addCustom = () => {
    const c = custom.trim().toUpperCase()
    if (!MODULE_CODE.test(c)) return setError("Module codes look like COMP30760")
    if (!picked.includes(c)) setPicked((p) => [...p, c])
    setCustom(""); setError("")
  }
  const submitCode = (value = code) =>
    run(() => verifySignup(email, password, value), () => go("area"))
  const submitFirst = () => mode === "login"
    ? run(() => logIn(email, password, next), (r) => r?.onboarding && go("area")) // unfinished sign-up → carry on
    : run(() => startSignup(email, password), () => go("code"))

  return (
    <Card className={cn("relative w-full rounded-none border-white/10 bg-black/70 py-8 backdrop-blur-md transition-[max-width] duration-500",
      wide ? "max-w-4xl" : "max-w-sm", step !== "email" && "min-h-[480px]")}>

      {step === "email" && (
        <>
          <CardHeader className="px-8">
            <div className="mb-4 flex gap-6" role="tablist">
              {(["login", "signup"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); setPassword("") }}
                  className={cn("label border-b pb-1 transition", mode === m ? "border-white text-white" : "border-transparent hover:text-white")}>
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
            {mode === "signup" && <p className="label">{stepLabel}</p>}
            <CardTitle className="font-display mt-2 text-3xl font-bold uppercase tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login" ? "Log in with your student email and password." : "Use your university email. Only verified students get in."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-8">
            <form className="flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); submitFirst() }}>
              <Label htmlFor="email" className="label mb-2">Student email</Label>
              <Input id="email" type="email" autoComplete="email" autoFocus required placeholder="you@youruniversity.ie"
                value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} className="h-11 rounded-none" />
              {uni && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/60">
                  <GraduationCap className="size-3.5" /> {uni} student
                </p>
              )}
              <Label htmlFor="password" className="label mb-2 mt-4">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} required minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : ""}
                  value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} className="h-11 rounded-none pr-10" />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <ErrorText text={error} />
              <Button type="submit" disabled={pending || !email || !password} className="mt-4 h-11 rounded-none bg-white text-black hover:bg-white/85">
                {pending ? "Checking…" : mode === "login" ? "Log in" : "Continue"} <ArrowRight />
              </Button>
            </form>
          </CardContent>
        </>
      )}

      {step === "code" && (
        <>
          <CardHeader className="px-8">
            <Back onClick={changeEmail}>Change email</Back>
            <p className="label mt-4">{stepLabel}</p>
            <CardTitle className="font-display mt-2 text-3xl font-bold uppercase tracking-tight">Check your inbox</CardTitle>
            <CardDescription>We sent a 6-digit code to <span className="text-white">{email}</span></CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-8">
            <InputOTP maxLength={6} value={code} autoFocus
              onChange={(v) => { setCode(v); if (v.length === 6) submitCode(v) }}>
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} className="size-11" />)}
              </InputOTPGroup>
            </InputOTP>
            <p className="label mt-4">Demo code: {DEMO_CODE}</p>
            <ErrorText text={error} />
            <Button onClick={() => submitCode()} disabled={pending || code.length < 6}
              className="mt-auto h-11 rounded-none bg-white text-black hover:bg-white/85">
              {pending ? "Checking…" : "Verify"} <ArrowRight />
            </Button>
          </CardContent>
        </>
      )}

      {step === "area" && (
        <>
          <CardHeader className="px-8 md:px-12">
            <Back onClick={changeEmail}>{email}</Back>
            <p className="label mt-4">{stepLabel} · {uni}</p>
            <CardTitle className="font-display mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl">Subject area</CardTitle>
            <CardDescription>Which area is your course in?</CardDescription>
          </CardHeader>
          <CardContent className="px-8 md:px-12">
            <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2 md:grid-cols-3">
              {[...areas, allCourses].map((a) => (
                <button key={a.id} onClick={() => { setArea(a); setCourse(""); setPicked([]); go("course") }}
                  className="group flex min-h-28 flex-col justify-between bg-black p-5 text-left transition hover:bg-white/5">
                  <span className="label">{a.courses.length} courses</span>
                  <span className="flex items-end justify-between gap-2 leading-tight">
                    {a.name}
                    <ArrowRight className="size-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </>
      )}

      {step === "course" && area && (
        <>
          <CardHeader className="px-8 md:px-12">
            <Back onClick={() => go("area")}>{area.name}</Back>
            <p className="label mt-4">{stepLabel}</p>
            <CardTitle className="font-display mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl">Your course</CardTitle>
            <CardDescription>Pick the course you&apos;re enrolled in.</CardDescription>
          </CardHeader>
          <CardContent className="px-8 md:px-12">
            <SearchBox value={query} onChange={setQuery} placeholder="Search courses" />
            <ul className="mt-4 grid max-h-80 grid-cols-1 overflow-y-auto border-t border-white/10 md:grid-cols-2 md:gap-x-8">
              {courses.map((c) => (
                <li key={c} className="border-b border-white/10">
                  <button onClick={() => {
                    if (area.id === "all") setArea(areas.find((a) => a.courses.includes(c)) ?? area)
                    setCourse(c); setPicked([]); go("modules")
                  }}
                    className="group flex w-full items-center justify-between py-3 text-left text-sm hover:text-white/70">
                    {c}
                    <ArrowRight className="size-4 opacity-0 transition group-hover:opacity-100" />
                  </button>
                </li>
              ))}
              {!courses.length && <li className="py-6 text-sm text-white/50">No courses match &ldquo;{query}&rdquo;.</li>}
            </ul>
          </CardContent>
        </>
      )}

      {step === "modules" && area && course && (
        <>
          <CardHeader className="px-8 md:px-12">
            <Back onClick={() => go("course")}>{course}</Back>
            <p className="label mt-4">{stepLabel}</p>
            <CardTitle className="font-display mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl">Your modules</CardTitle>
            <CardDescription>Pick what you&apos;re taking this year, or add module codes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-8 md:px-12">
            {suggested.length > 0 && (
              <ul className="grid max-h-64 grid-cols-1 overflow-y-auto border-t border-white/10 md:grid-cols-2 md:gap-x-8">
                {suggested.map((m) => (
                  <li key={m.code} className="border-b border-white/10">
                    <Label className="flex cursor-pointer items-center gap-3 py-3">
                      <Checkbox checked={picked.includes(m.code)} onCheckedChange={() => toggle(m.code)} />
                      <span className="flex-1">
                        <span className="block font-mono text-xs text-white/50">{m.code} · {m.school}</span>
                        <span className="block text-sm">{m.name}</span>
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            )}
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); addCustom() }}>
              <Input placeholder="Add a module code, e.g. COMP30760" value={custom} onChange={(e) => setCustom(e.target.value)}
                className="h-11 rounded-none font-mono uppercase placeholder:normal-case" />
              <Button type="submit" variant="outline" className="h-11 rounded-none"><Plus /> Add</Button>
            </form>
            <div className="mt-3 flex min-h-8 flex-wrap gap-2">
              {picked.filter((c) => !suggested.some((m) => m.code === c)).map((c) => (
                <button key={c} onClick={() => toggle(c)} className="flex items-center gap-1 border border-white/20 px-2 py-1 font-mono text-xs hover:border-white">
                  {c} <X className="size-3" />
                </button>
              ))}
            </div>
            <ErrorText text={error} />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="label">{picked.length} selected</p>
              <Button onClick={() => run(() => completeSignup(area.id, course, picked, next))} disabled={pending || !picked.length}
                className="h-11 rounded-none bg-white px-6 text-black hover:bg-white/85">
                {pending ? "Saving…" : "Finish sign up"} <ArrowRight />
              </Button>
            </div>
          </CardContent>
        </>
      )}
      {uni === "UCD" && step === "code" && (
        <Image src="/media/ucd-crest.svg" alt="UCD" width={40} height={58}
          className="absolute right-6 top-6 h-14 w-auto animate-in fade-in zoom-in-95 duration-500" />
      )}
    </Card>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-none pl-9" />
    </div>
  )
}

function Back({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="label flex w-fit items-center gap-1 hover:text-white">
      <ArrowLeft className="size-3" /> {children}
    </button>
  )
}

function ErrorText({ text }: { text: string }) {
  return text ? <p role="alert" className="mt-2 text-sm text-destructive">{text}</p> : null
}
