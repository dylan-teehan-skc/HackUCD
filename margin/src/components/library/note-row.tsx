"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDown, Download, Loader2, Sparkles } from "lucide-react"
import { StarButton } from "./star-button"
import type { DemoNote } from "@/lib/demo-notes"
import type { NoteSummary } from "@/lib/summaries"
import { generateNoteSummary } from "@/app/library-actions"
import { routes } from "@/lib/site"

// One ranked note. Sparkle = AI summary of this PDF (generated once, then cached), shown in a panel under the row.
export function NoteRow({ note, rank, starred, summary: initial }: { note: DemoNote; rank: number; starred: boolean; summary: NoteSummary | null }) {
  const [summary, setSummary] = useState(initial)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  const onSparkle = () => {
    if (summary) return setOpen((o) => !o)
    setOpen(true)
    start(async () => {
      setError("")
      const r = await generateNoteSummary(note.id)
      if (r.summary) setSummary(r.summary); else setError(r.error ?? "Something went wrong.")
    })
  }

  return (
    <li className="border border-white/[0.06] bg-charcoal transition hover:border-white/20">
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="font-display w-8 text-xl font-bold text-white/30">{rank}</span>
        <Link href={routes.note(note.id)} className="min-w-0 flex-1 hover:underline">
          <span className="block truncate">{note.title}</span>
          <span className="mt-0.5 block font-mono text-[11px] text-white/40">
            {note.author} · {note.lecturer}, {note.year} · {note.kind} · {note.pages} {note.pages === 1 ? "page" : "pages"}
          </span>
        </Link>
        {note.file && (
          <button type="button" onClick={onSparkle} aria-expanded={open} aria-label={summary ? "Show AI summary" : "Generate AI summary"}
            title={summary ? "AI summary" : "Generate AI summary"}
            className={`flex items-center gap-1 transition hover:text-white ${summary ? "text-star" : "text-white/40"}`}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {summary && <ChevronDown className={`size-3 transition ${open ? "rotate-180" : ""}`} />}
          </button>
        )}
        {note.file && (
          <a href={note.file} download aria-label={`Download ${note.title}`} className="text-white/40 hover:text-white">
            <Download className="size-4" />
          </a>
        )}
        <StarButton noteId={note.id} starred={starred} count={note.stars} />
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-5 py-4 md:pl-[4.25rem]">
          {pending && (
            <div className="space-y-2" aria-busy>
              <p className="label">Reading the PDF…</p>
              {[85, 70, 60].map((w) => <div key={w} className="h-2.5 animate-pulse bg-white/10" style={{ width: `${w}%` }} />)}
            </div>
          )}
          {error && !pending && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {summary && !pending && (
            <div className="space-y-3 text-sm">
              <p className="text-white/85">{summary.overview}</p>
              <ul className="list-disc space-y-1 pl-5 text-white/70">{summary.covers.map((c) => <li key={c}>{c}</li>)}</ul>
              {summary.good_for && <p className="text-white/55"><span className="label mr-2">Good for</span>{summary.good_for}</p>}
              <p className="label pt-1">AI summary · {summary.model.split("/").pop()} · may miss equations and diagrams</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
