import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"
import { getSession } from "@/lib/session"
import { moduleName, moduleStats } from "@/lib/demo-notes"
import { allNotes } from "@/lib/library"
import { areas } from "@/lib/ucd"
import { routes } from "@/lib/site"
import { Reveal } from "@/components/landing/reveal"

export const metadata = { title: "Library · Margin" }

export default function ModulesPage() {
  return (
    <main className="px-6 pb-24 pt-32 md:px-10">
      <Suspense fallback={<p className="label">Loading your modules…</p>}>
        <Modules />
      </Suspense>
    </main>
  )
}

// Absolute date: no Date.now() during render (cacheComponents treats it as unstable).
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short" })

async function Modules() {
  const profile = (await getSession())?.profile
  if (!profile) return null // proxy.ts already redirects signed-out users
  const area = areas.find((a) => a.id === profile.area_id)?.name
  const all = await allNotes()

  return (
    <>
      <Reveal>
        <p className="label">{profile.university} · {profile.course}{area ? ` · ${area}` : ""}</p>
        <h1 className="font-display mt-4 text-5xl font-bold uppercase tracking-tight md:text-7xl">Your modules</h1>
        <p className="mt-4 max-w-xl text-lg text-white/60">Notes shared by students in each module, best first.</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-16">
        <ul className="space-y-2">
          {profile.module_codes.map((code) => {
            const s = moduleStats(code, all)
            return (
              <li key={code}>
                <Link href={routes.module(code)}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 border border-white/[0.06] bg-charcoal px-6 py-5 transition hover:border-white/20 hover:bg-charcoal-hover md:grid-cols-[10rem_1fr_auto_auto]">
                  <span className="font-mono text-sm text-white/50">{code}</span>
                  <span className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
                    <span className="block text-lg md:text-xl">{moduleName(code) ?? <span className="text-white/50">Added by you</span>}</span>
                  </span>
                  <span className="label col-span-2 row-start-3 whitespace-nowrap md:col-span-1 md:row-start-auto">
                    {s.notes ? <>{s.notes} {s.notes === 1 ? "note" : "notes"} · <Star className="mb-0.5 inline size-3 fill-star text-star" /> {s.stars} · updated {day(s.updated!)}</> : "No notes yet · be the first"}
                  </span>
                  <ArrowRight className="col-start-2 row-start-1 size-5 justify-self-end text-white/40 transition group-hover:translate-x-1 group-hover:text-white md:col-start-auto md:row-start-auto" />
                </Link>
              </li>
            )
          })}
        </ul>
      </Reveal>
    </>
  )
}
