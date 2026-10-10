"use client"

import { useState, useTransition } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { startTip } from "@/app/library-actions"
import { TIPS, euro, type TipItem } from "@/lib/tips"

// A pint of stout (generic, no brand): dark glass, cream head.
function Pint({ className = "h-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={`${className} w-auto`} aria-hidden>
      <path d="M8 6h32l-3 52a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4L8 6z" fill="#120d0b" stroke="#ffffff33" />
      <path d="M8 6h32l-0.8 11H8.8L8 6z" fill="#f3e6c8" />
      <path d="M12 22l1.5 34" stroke="#ffffff22" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
// Same visual size for all three: emoji font-size ≈ pint height.
const icon = (k: TipItem, small = false) =>
  k === "pint" ? <Pint className={small ? "h-7" : "h-14"} /> : <span className={`${small ? "text-[1.6rem]" : "text-5xl"} leading-none`}>{k === "coffee" ? "☕" : "🐹"}</span>

export function TipDialog({ noteId, author, supporters }: { noteId: string; author: string; supporters: number }) {
  const [pick, setPick] = useState<TipItem>("coffee")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  const pay = () => start(async () => {
    setError("")
    const r = await startTip(noteId, pick)
    if (r.url) window.location.href = r.url // Stripe-hosted checkout
    else setError(r.error ?? "Couldn't start the payment.")
  })

  return (
    <Dialog>
      {/* Under History: heading + one box-button. Logos and prices only appear in the pop-up. */}
      <section>
        <p className="label mb-3">Did you find these notes helpful?</p>
        <DialogTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between gap-3 border border-white/[0.06] bg-charcoal px-4 py-3.5 text-left transition hover:border-white/30 hover:bg-charcoal-hover">
            <span>
              <span className="block">Leave a tip to say thanks</span>
              <span className="mt-0.5 block text-xs text-white/45">
                {supporters > 0 ? `${supporters} ${supporters === 1 ? "student has" : "students have"} thanked ${author}` : `Be the first to thank ${author}`}
              </span>
            </span>
            <Heart className="size-4 shrink-0 text-white/50" />
          </button>
        </DialogTrigger>
      </section>
      <DialogContent className="rounded-none border-white/10 bg-black sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold uppercase tracking-tight">Did you find these notes helpful?</DialogTitle>
          <DialogDescription>Say thanks to {author} with something small. 90% goes to them; Margin keeps 10%.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a tip">
          {(Object.keys(TIPS) as TipItem[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={pick === k} onClick={() => setPick(k)}
              className={`flex flex-col items-center gap-3 border px-3 py-5 transition ${pick === k ? "border-white bg-white/[0.06]" : "border-white/10 bg-charcoal hover:border-white/40"}`}>
              <span className="grid h-16 place-items-center">{icon(k)}</span>
              <span className="text-sm">{TIPS[k].label}</span>
              <span className="font-mono text-lg">{euro(TIPS[k].amount)}</span>
            </button>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={pay} disabled={pending} className="h-11 rounded-none bg-white text-black hover:bg-white/85">
          {pending ? <Loader2 className="animate-spin" /> : <Heart />} Send {TIPS[pick].label.toLowerCase()} · {euro(TIPS[pick].amount)}
        </Button>
        <p className="label text-center">Secure payment by Stripe</p>
      </DialogContent>
    </Dialog>
  )
}
