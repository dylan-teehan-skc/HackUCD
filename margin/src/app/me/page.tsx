import { Suspense } from "react"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { allNotes, connectedAccount, tipsForAuthor } from "@/lib/library"
import { stripe } from "@/lib/stripe"
import { AUTHOR_SHARE, payoutsReady, releaseHeldTips } from "@/lib/payouts"
import { TIPS, euro, type TipItem } from "@/lib/tips"
import { routes } from "@/lib/site"
import { PayoutButton } from "@/components/library/payout-button"

export const metadata = { title: "Your tips · Margin" }

export default function MePage(props: PageProps<"/me">) {
  return (
    <main className="px-6 pb-24 pt-32 md:px-10">
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Your tips</h1>
      <p className="mt-4 max-w-xl text-lg text-white/60">When students tip your notes, {AUTHOR_SHARE * 100}% comes to you. Set up payouts once and Stripe sends it to your bank.</p>
      <Suspense fallback={<p className="label mt-12">Loading…</p>}>
        <Tips {...props} />
      </Suspense>
    </main>
  )
}

async function Tips({ searchParams }: PageProps<"/me">) {
  const email = (await getSession())!.profile!.email
  const client = (() => { try { return stripe() } catch { return null } })()
  const account = await connectedAccount(email)
  let ready = false
  if (client && account) {
    ready = await payoutsReady(client, account).catch(() => false)
    if (ready) await releaseHeldTips(client, email).catch((e) => console.error("tip transfer failed:", e.message)) // retries any held tip; idempotent
  }
  const [tips, notes] = await Promise.all([tipsForAuthor(email), allNotes()])
  const share = (c: number) => Math.floor(c * AUTHOR_SHARE)
  const paid = tips.filter((t) => t.transfer).reduce((s, t) => s + share(t.amount), 0)
  const held = tips.filter((t) => !t.transfer).reduce((s, t) => s + share(t.amount), 0)
  const title = (id: string) => notes.find((n) => n.id === id)?.title ?? "A note"

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[22rem_1fr]">
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Paid to you" value={euro(paid)} />
          <Stat label="Waiting for you" value={euro(held)} />
        </div>
        <div className="border border-white/[0.06] bg-charcoal p-5">
          <p className="label mb-2">Payouts</p>
          {ready ? (
            <p className="text-sm text-white/70">✓ Set up. New tips go to you automatically.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-white/70">
                {account ? "Finish your Stripe setup to receive tips." : held ? `You have ${euro(held)} waiting. Set up payouts to receive it.` : "Set up payouts so tips reach your bank."}
              </p>
              <PayoutButton label={account ? "Finish setup" : "Set up payouts"} />
            </>
          )}
          <p className="label mt-4">Secure setup by Stripe · test mode</p>
        </div>
      </section>

      <section>
        <p className="label mb-3">Tips received · {tips.length}</p>
        {tips.length === 0 && <p className="border border-white/[0.06] bg-charcoal p-5 text-sm text-white/50">No tips yet. <Link href={routes.library} className="underline">Upload notes</Link> people find helpful.</p>}
        <ul className="space-y-2">
          {tips.map((t) => (
            <li key={t.session} className="flex items-center justify-between gap-4 border border-white/[0.06] bg-charcoal px-5 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{TIPS[t.item as TipItem]?.label ?? "A tip"} for &ldquo;{title(t.note_id)}&rdquo;</span>
                <span className="font-mono text-[11px] text-white/40">{t.date} · you get {euro(share(t.amount))} of {euro(t.amount)}</span>
              </span>
              <span className={t.transfer ? "text-emerald-400" : "text-white/40"}>{t.transfer ? "Paid" : "Held"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="border border-white/[0.06] bg-charcoal p-5"><p className="label">{label}</p><p className="font-display mt-2 text-3xl font-bold">{value}</p></div>
}
