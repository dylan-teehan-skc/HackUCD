"use client"

import { useState, useTransition } from "react"
import { Star } from "lucide-react"
import { star } from "@/app/library-actions"

// Star = add to your Favourites. Optimistic: flips instantly, rolls back if the server says no.
export function StarButton({ noteId, starred: initialStarred, count: initialCount, boxed }: { noteId: string; starred: boolean; count: number; boxed?: boolean }) {
  const [starred, setStarred] = useState(initialStarred)
  const [count, setCount] = useState(initialCount)
  const [, start] = useTransition()

  const toggle = () => {
    const was = { starred, count }
    setStarred(!starred)
    setCount(count + (starred ? -1 : 1))
    start(async () => {
      const r = await star(noteId)
      if (r.error || r.count === undefined) { setStarred(was.starred); setCount(was.count) }
      else { setStarred(!!r.starred); setCount(r.count) }
    })
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={starred} title={starred ? "Remove from Favourites" : "Add to Favourites"}
      className={`flex items-center justify-end gap-1.5 font-mono text-sm transition hover:text-star ${starred ? "text-star" : "text-white/60"} ${boxed ? "border border-white/15 px-3 py-2 hover:border-white" : "w-16"}`}>
      <Star className={`size-4 ${starred ? "fill-current" : ""}`} /> {count}
    </button>
  )
}
