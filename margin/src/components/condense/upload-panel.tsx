"use client"

import { useActionState, useEffect, useState } from "react"
import { Check, FileUp, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { condenseSlides, type CondenseState } from "@/app/condense/actions"

const field = "h-10 w-full rounded-none border border-white/15 bg-black px-3 text-sm"
const STEPS = ["Reading slides…", "Writing your notes…", "Laying out the page…"]

export function UploadPanel({ modules, hasStyle }: { modules: { code: string; name: string }[]; hasStyle: boolean }) {
  const [state, action, pending] = useActionState<CondenseState, FormData>(condenseSlides, {})
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const [step, setStep] = useState(0)

  // ponytail: fake progress (one request does it all); real streaming if decks get long.
  useEffect(() => {
    if (!pending) return setStep(0)
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000)
    return () => clearInterval(t)
  }, [pending])

  const pick = (f?: File | null) => f && setFile(f)

  return (
    <form action={(f) => { if (file) f.set("file", file); action(f) }} className="grid gap-6">
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
        className={`flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 border border-dashed bg-charcoal px-6 text-center transition ${drag ? "border-white" : "border-white/20 hover:border-white/40"}`}>
        <FileUp className="size-8 text-white/50" />
        <span className="font-display text-2xl font-bold uppercase tracking-tight">Drop lecture slides</span>
        <span className="label">PDF or PowerPoint · up to 20 MB</span>
        <input type="file" accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>

      {file && (
        <div className="flex items-center justify-between border border-white/10 bg-charcoal px-4 py-3 text-sm">
          <span className="truncate">{file.name} <span className="ml-2 font-mono text-xs text-white/40">{(file.size / 1e6).toFixed(1)} MB</span></span>
          <button type="button" aria-label="Remove file" onClick={() => setFile(null)} className="text-white/40 hover:text-white"><X className="size-4" /></button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span className="label">Module</span>
          <select name="module_code" className={field}>{modules.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}</select>
        </label>
        <label className="grid gap-1.5"><span className="label">Length</span>
          <select name="length" defaultValue="standard" className={field}>
            <option value="short">Short</option><option value="standard">Standard</option><option value="detailed">Detailed</option>
          </select>
        </label>
      </div>

      <label className={`flex items-center gap-3 text-sm ${hasStyle ? "" : "text-white/40"}`}>
        <input type="checkbox" name="style" defaultChecked={hasStyle} disabled={!hasStyle} className="size-4 accent-white" />
        Write it in my style
        {!hasStyle && <a href="?tab=notes" className="underline hover:text-white">add your notes first</a>}
      </label>

      {state.error && !pending && <p role="alert" className="text-sm text-destructive">{state.error}</p>}

      {pending ? (
        <ol className="space-y-2 border border-white/10 bg-charcoal px-5 py-4 text-sm" aria-live="polite">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 ${i > step ? "text-white/30" : ""}`}>
              {i < step ? <Check className="size-4 text-star" /> : i === step ? <Loader2 className="size-4 animate-spin" /> : <span className="size-4" />}{s}
            </li>
          ))}
        </ol>
      ) : (
        <Button disabled={!file} className="h-12 rounded-none bg-white text-base text-black hover:bg-white/85">Condense →</Button>
      )}
    </form>
  )
}
