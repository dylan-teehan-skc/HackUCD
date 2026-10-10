import { Suspense } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { getSession } from "@/lib/session"
import { allNotes, starredIds } from "@/lib/library"
import { moduleName } from "@/lib/demo-notes"
import { cachedSummaries } from "@/lib/summaries"
import { routes } from "@/lib/site"
import { NoteRow } from "@/components/library/note-row"

export const metadata = { title: "Favourites · Margin" }

export default function FavouritesPage() {
  return (
    <main className="px-6 pb-24 pt-32 md:px-10">
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Favourites</h1>
      <p className="mt-4 max-w-xl text-lg text-white/60">Notes you&apos;ve starred, by module. Tap the star again to remove one.</p>
      <Suspense fallback={<p className="label mt-12">Loading favourites…</p>}>
        <Favourites />
      </Suspense>
    </main>
  )
}

async function Favourites() {
  const email = (await getSession())?.profile?.email
  const ids = await starredIds(email)
  const notes = (await allNotes()).filter((n) => ids.has(n.id))
  if (!notes.length) {
    return (
      <div className="mt-12 border border-white/[0.06] bg-charcoal p-8 text-white/60">
        <Star className="mb-3 size-5" />
        No favourites yet. Star any note in <Link href={routes.library} className="text-white underline">your modules</Link> and it shows up here.
      </div>
    )
  }
  const summaries = await cachedSummaries(notes)
  const modules = [...new Set(notes.map((n) => n.module_code))]
  return (
    <div className="mt-12 space-y-12">
      {modules.map((code) => (
        <section key={code}>
          <Link href={routes.module(code)} className="flex items-baseline gap-3 hover:underline">
            <span className="font-mono text-sm text-white/50">{code}</span>
            <h2 className="text-2xl">{moduleName(code) ?? "Module"}</h2>
          </Link>
          <ol className="mt-4 space-y-2">
            {notes.filter((n) => n.module_code === code).map((n, i) => (
              <NoteRow key={n.id} note={n} rank={i + 1} starred summary={summaries[n.id]} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
