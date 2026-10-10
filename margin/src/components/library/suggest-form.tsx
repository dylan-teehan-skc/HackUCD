"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { suggestEdit, type FormState } from "@/app/library-actions"

export function SuggestForm({ noteId, pages }: { noteId: string; pages: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(suggestEdit, {})
  if (state.ok) return <p className="border border-white/10 p-4 text-sm text-white/70">{state.ok}</p>
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="note_id" value={noteId} />
      <Label className="label" htmlFor="reason">What should change?</Label>
      <Textarea id="reason" name="reason" required minLength={5} maxLength={1000} rows={4}
        placeholder="e.g. Page 3: the gradient sign is flipped, it should be negative." className="rounded-none" />
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <div className="grid gap-1.5">
          <Label className="label" htmlFor="page">Page</Label>
          <Input id="page" name="page" type="number" min={1} max={pages} className="h-10 rounded-none" />
        </div>
        <div className="grid gap-1.5">
          <Label className="label" htmlFor="file">Fixed PDF (optional)</Label>
          <Input id="file" name="file" type="file" accept="application/pdf,.pdf" className="h-10 rounded-none" />
        </div>
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button disabled={pending} variant="outline" className="h-10 rounded-none">{pending ? "Sending…" : "Send suggestion"}</Button>
    </form>
  )
}
