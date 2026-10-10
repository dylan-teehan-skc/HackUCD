"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { setupPayouts } from "@/app/library-actions"

export function PayoutButton({ label }: { label: string }) {
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  return (
    <>
      <Button onClick={() => start(async () => { const r = await setupPayouts(); if (r?.error) setError(r.error) })}
        disabled={pending} className="h-10 w-full rounded-none bg-white text-black hover:bg-white/85">
        {pending ? "Opening Stripe…" : label}
      </Button>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </>
  )
}
