"use client"

import { useActionState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createTopic, type FormState } from "@/app/library-actions"

export function NewTopicDialog({ code }: { code: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTopic, {})
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 rounded-none"><Plus /> New topic</Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-white/10 bg-black sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold uppercase tracking-tight">New topic</DialogTitle>
          <DialogDescription>Everyone in {code} will see it. Then upload the first notes.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="module_code" value={code} />
          <Input name="name" required minLength={2} maxLength={60} autoFocus placeholder="e.g. Reinforcement learning" className="h-10 rounded-none" />
          {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
          <Button disabled={pending} className="h-10 rounded-none bg-white text-black hover:bg-white/85">{pending ? "Adding…" : "Add topic"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
