"use client"

import { useActionState, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadNote, type FormState } from "@/app/library-actions"

type Props = { code: string; topics: string[]; lecturers: string[]; years: string[]; topic?: string }
const field = "h-10 w-full rounded-none border border-input bg-transparent px-3 text-sm"

export function UploadDialog({ code, topics, lecturers, years, topic }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadNote, {})
  const [lecturer, setLecturer] = useState(lecturers[0] ?? "__new")
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-none bg-white px-4 text-black hover:bg-white/85"><Upload /> Upload notes</Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-white/10 bg-black sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold uppercase tracking-tight">Upload notes</DialogTitle>
          <DialogDescription>PDF, up to 20 MB. Students in {code} can see it, star it and suggest edits.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="module_code" value={code} />
          <Row label="Title"><Input name="title" required minLength={3} maxLength={120} placeholder="e.g. Backprop in one page" className="h-10 rounded-none" /></Row>
          <Row label="Topic">
            <select name="topic" defaultValue={topic ?? topics[0]} className={field}>{topics.map((t) => <option key={t}>{t}</option>)}</select>
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Lecturer">
              <select name="lecturer" value={lecturer} onChange={(e) => setLecturer(e.target.value)} className={field}>
                {lecturers.map((l) => <option key={l}>{l}</option>)}
                <option value="__new">+ Add a lecturer…</option>
              </select>
            </Row>
            <Row label="Year">
              <select name="year" defaultValue={years[0]} className={field}>{years.map((y) => <option key={y}>{y}</option>)}</select>
            </Row>
          </div>
          {lecturer === "__new" && (
            <Row label="New lecturer"><Input name="lecturer_new" required minLength={3} maxLength={60} placeholder="e.g. Dr. Jane Smith" className="h-10 rounded-none" /></Row>
          )}
          <Row label="PDF"><Input name="file" type="file" accept="application/pdf,.pdf" required className="h-10 rounded-none" /></Row>
          {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
          <Button disabled={pending} className="h-11 rounded-none bg-white text-black hover:bg-white/85">{pending ? "Uploading…" : "Upload"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label className="label">{label}</Label>{children}</div>
}
