"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Plus, RefreshCw, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { deleteSample, restyle, retry, uploadSample, type CondenseState } from "@/app/condense/actions"
import type { Sample, Trait } from "@/lib/condense"

// Your notes tab: past notes you wrote → "your style" traits that every condense copies.
export function StylePanel({ samples, traits, max }: { samples: Sample[]; traits: Trait[]; max: number }) {
  const [state, add, adding] = useActionState<CondenseState, FormData>(uploadSample, {})
  const [restyled, refresh, refreshing] = useActionState<CondenseState>(restyle, {})
  const form = useRef<HTMLFormElement>(null)
  const reading = samples.filter((s) => s.status === "reading").length
  const busy = adding || refreshing || reading > 0
  const router = useRouter()

  // Photos are read in the background: refresh until they're done (and the style catches up).
  const waitingForStyle = samples.some((s) => s.chars > 0) && !traits.length
  useEffect(() => {
    if (!reading && !waitingForStyle) return
    const t = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(t)
  }, [reading, waitingForStyle, router])
  const error = (adding || refreshing) ? "" : state.error || restyled.error

  return (
    <div className="grid gap-10">
      <section className="border border-white/[0.06] bg-charcoal p-6 text-center md:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">Your style</h2>
        {busy ? (
          <p className="label mt-5 flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> {reading ? `Reading ${reading} ${reading === 1 ? "page" : "pages"} of your notes… (about 30s, you can leave this page)` : "Reading how you write…"}</p>
        ) : traits.length ? (
          <ul className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            {traits.map((t) => (
              <li key={t.trait} className="border border-white/10 p-4">
                <p>{t.trait}</p>
                {t.evidence && <p className="mt-1 text-sm italic text-white/50">“{t.evidence}”</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-auto mt-3 max-w-xl text-white/60">Add 1–3 of your own notes so Condense writes like you. Skip it and you get clean notes in Margin&apos;s default style.</p>
        )}
        {samples.length > 0 && !busy && (
          <form action={refresh} className="mt-5 flex justify-center">
            <button className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white"><RefreshCw className="size-4" /> Refresh style</button>
          </form>
        )}
      </section>

      <section>
        <p className="label mb-4 text-center">Your notes · {samples.length} of {max}</p>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {samples.length < max && (
            <li>
              <form ref={form} action={add} className="h-full">
                <label className={`flex aspect-[3/4] h-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-white/20 text-center text-sm text-white/60 transition hover:border-white/40 hover:text-white ${busy ? "pointer-events-none opacity-50" : ""}`}>
                  {adding ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />} {adding ? "Uploading…" : "Add your notes"}
                  <span className="label px-3">Pick several at once · photos, PDF, PPTX, .txt</span>
                  <input type="file" name="file" multiple accept="image/*,.heic,.pdf,.pptx,.txt" className="sr-only" onChange={() => form.current?.requestSubmit()} />
                </label>
              </form>
            </li>
          )}
          {samples.map((s) => <SampleCard key={s.id} sample={s} />)}
        </ul>
        {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
      </section>
    </div>
  )
}

// One of your notes. Click to see it full size with what the AI read from it.
function SampleCard({ sample: s }: { sample: Sample }) {
  return (
    <li className="group relative aspect-[3/4] border border-white/[0.06] bg-charcoal">
      <Dialog>
        <DialogTrigger className="flex h-full w-full flex-col text-left">
          {s.image
            // eslint-disable-next-line @next/next/no-img-element -- signed-in API file, not a static asset
            ? <img src={s.image} alt={`Your notes: ${s.name}`} className="min-h-0 w-full flex-1 object-cover" />
            : <span className="min-h-0 flex-1 overflow-hidden p-4 text-xs leading-relaxed text-white/50"><FileText className="mb-2 size-4" />{s.excerpt.slice(0, 400)}</span>}
          <span className="block truncate border-t border-white/[0.06] px-3 py-2 text-sm">{s.name}<span className="ml-2 font-mono text-[11px] text-white/40">{s.date}</span></span>
        </DialogTrigger>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none border-white/10 bg-black sm:max-w-5xl">
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-tight">{s.name}</DialogTitle>
          <div className={`grid gap-6 ${s.image ? "md:grid-cols-[3fr_2fr]" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.image && <img src={s.image} alt={`Your notes: ${s.name}`} className="w-full" />}
            <div>
              <p className="label mb-2">What Margin read</p>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">{s.excerpt}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {s.status && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-black/80 px-3 py-2 text-xs">
          {s.status === "reading"
            ? <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Reading…</span>
            : <><span className="text-destructive">Couldn&apos;t read</span><button onClick={() => retry(s.id)} className="underline hover:text-white">Try again</button></>}
        </div>
      )}
      <button aria-label={`Remove ${s.name}`} onClick={() => deleteSample(s.id)}
        className="absolute bottom-12 right-2 bg-black/70 p-1 text-white/60 opacity-0 transition hover:text-white focus:opacity-100 group-hover:opacity-100"><X className="size-4" /></button>
    </li>
  )
}
