import { Suspense } from "react"
import Link from "next/link"
import { Download, Trash2 } from "lucide-react"
import { getSession } from "@/lib/session"
import { MAX_SAMPLES, outputsFor, samplesFor } from "@/lib/condense"
import { moduleName } from "@/lib/demo-notes"
import { routes } from "@/lib/site"
import { UploadPanel } from "@/components/condense/upload-panel"
import { PaperNotes } from "@/components/condense/paper-notes"
import { StylePanel } from "@/components/condense/style-panel"
import { removeOutput } from "./actions"

export const metadata = { title: "Condense · Margin" }

const TABS = { notes: "Your notes", upload: "Upload", outputs: "Outputs" } as const
type Tab = keyof typeof TABS
type Search = Promise<{ tab?: string; id?: string }>

export default function CondensePage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="px-6 pb-24 pt-32 md:px-10">
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Condense</h1>
      <p className="mt-4 max-w-xl text-lg text-white/60">Drop in lecture slides. Get notes written the way you learn.</p>
      <Suspense fallback={<p className="label mt-12">Loading…</p>}>
        <Workspace searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Workspace({ searchParams }: { searchParams: Search }) {
  const me = (await getSession())?.profile
  if (!me) return null // proxy already sends signed-out users to /login
  const { tab: raw, id } = await searchParams
  const [outputs, { samples, traits }] = await Promise.all([outputsFor(me.email), samplesFor(me.email)])
  const tab: Tab = raw && raw in TABS ? (raw as Tab) : outputs.some((o) => !o.html) ? "outputs" : "upload"

  return (
    <>
      <nav className="mt-10 flex gap-8 border-b border-white/10 text-sm">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <Link key={t} href={`${routes.condense}?tab=${t}`}
            className={`-mb-px border-b pb-3 ${tab === t ? "border-white" : "border-transparent text-white/40 hover:text-white"}`}>
            {TABS[t]}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        {tab === "upload" && (
          <div className="mx-auto max-w-3xl">
            <UploadPanel modules={me.module_codes.map((code) => ({ code, name: moduleName(code) ?? code }))} hasStyle={traits.length > 0} />
          </div>
        )}
        {tab === "notes" && (
          <div className="mx-auto max-w-5xl"><StylePanel samples={samples} traits={traits} max={MAX_SAMPLES} /></div>
        )}
        {tab === "outputs" && <Outputs outputs={outputs} id={id} />}
      </div>
    </>
  )
}

function Outputs({ outputs, id }: { outputs: Awaited<ReturnType<typeof outputsFor>>; id?: string }) {
  if (!outputs.length) {
    return (
      <div className="mx-auto max-w-3xl border border-white/[0.06] bg-charcoal p-8 text-center text-white/60">
        Nothing yet. <Link href={`${routes.condense}?tab=upload`} className="text-white underline">Upload slides</Link> to get your first notes.
      </div>
    )
  }
  const open = outputs.find((o) => o.id === id) ?? outputs[0]
  return (
    <div className="grid gap-8">
      {/* Every condense you've done, newest first */}
      <ul className="flex gap-3 overflow-x-auto pb-2">
        {outputs.map((o) => (
          <li key={o.id} className="w-64 shrink-0">
            <Link href={`${routes.condense}?tab=outputs&id=${o.id}`}
              className={`block border bg-charcoal px-4 py-3 transition ${o.id === open.id ? "border-white/40" : "border-white/[0.06] hover:border-white/20"}`}>
              <span className="block truncate">{o.title}</span>
              <span className="mt-0.5 block truncate font-mono text-[11px] text-white/40">{o.html ? "Example" : `${o.module_code} · ${o.date}`}{o.styled && <span className="text-star"> · your style</span>}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* What went in: the uploaded deck */}
        <section className="lg:sticky lg:top-24">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="label truncate">Your slides · {short(open.source)}</p>
            {open.deck && <a href={open.deck} download={open.source} className="flex shrink-0 items-center gap-1.5 text-sm text-white/40 hover:text-white"><Download className="size-4" /> Original</a>}
          </div>
          {open.deck?.endsWith(".pdf") ? (
            <iframe src={`${open.deck}#view=FitH`} title={`Slides: ${open.source}`} className="h-[78vh] w-full border border-white/10 bg-white" />
          ) : (
            <ol className="grid max-h-[78vh] gap-3 overflow-y-auto pr-1">
              {(open.slide_texts ?? []).filter(Boolean).map((t, i) => <Slide key={i} n={i + 1} text={t} />)}
            </ol>
          )}
        </section>

        {/* What came out: notes in your style */}
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="label truncate">Your notes · {open.styled ? "in your style" : open.length}{!open.html && ` · ${open.model.split("/").pop()}`}</p>
            {!open.html && <form action={removeOutput.bind(null, open.id)}>
              <button aria-label="Delete these notes" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white"><Trash2 className="size-4" /> Delete</button>
            </form>}
          </div>
          {open.html ? <iframe src={open.html} title={`Notes: ${open.title}`} className="h-[78vh] w-full border border-white/10 bg-white" /> : <PaperNotes notes={open.notes} label={open.module_code} />}
        </section>
      </div>
    </div>
  )
}

// A plain template slide: first few words as the title, the rest as body.
function Slide({ n, text }: { n: number; text: string }) {
  const words = text.split(" ")
  return (
    <li className="relative aspect-video overflow-hidden bg-white px-6 py-5 text-black">
      <p className="line-clamp-2 text-base font-bold leading-tight">{words.slice(0, 8).join(" ")}</p>
      <p className="mt-2 line-clamp-4 text-xs leading-snug text-black/70">{words.slice(8).join(" ")}</p>
      <span className="absolute bottom-2 right-3 font-mono text-[10px] text-black/40">{n}</span>
    </li>
  )
}

const short = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}…` : s)
