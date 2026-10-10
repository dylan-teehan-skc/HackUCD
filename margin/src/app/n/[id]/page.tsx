import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Check, Download, FileText, X } from "lucide-react"
import { getSession } from "@/lib/session"
import { getNote, handle, starredIds, tipsFor } from "@/lib/library"
import { recordPaidSession } from "@/lib/payouts"
import { TipDialog } from "@/components/library/tip-dialog"
import { stripe } from "@/lib/stripe"
import { TIPS, euro, type TipItem } from "@/lib/tips"
import { StarButton } from "@/components/library/star-button"
import { moduleName, topicSlug } from "@/lib/demo-notes"
import { routes } from "@/lib/site"
import { review } from "@/app/library-actions"
import { SuggestForm } from "@/components/library/suggest-form"

export const metadata = { title: "Note · Margin" }

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })

export default function NotePage(props: PageProps<"/n/[id]">) {
  return (
    <main className="px-6 pb-24 pt-28 md:px-10">
      <Suspense fallback={<p className="label pt-4">Loading note…</p>}>
        <Note {...props} />
      </Suspense>
    </main>
  )
}

async function Note({ params, searchParams }: PageProps<"/n/[id]">) {
  const [found, session] = await Promise.all([getNote((await params).id), getSession()])
  if (!found) notFound()
  const { note, history, suggestions } = found
  const me = session?.profile?.email
  const starred = await starredIds(me)
  const thanked = await confirmTip(note.id, (await searchParams).tip_session)
  const tips = await tipsFor(note.id)
  const isAuthor = !!me && note.owner === me
  const pending = suggestions.filter((x) => x.status === "pending")
  const mine = suggestions.filter((x) => x.proposer === me)

  return (
    <>
      <Link href={routes.topic(note.module_code, topicSlug(note.topic))} className="label flex w-fit items-center gap-1 hover:text-white">
        <ArrowLeft className="size-3" /> {note.module_code} · {moduleName(note.module_code) ?? "Module"} · {note.topic}
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl">{note.title}</h1>
          <p className="mt-2 font-mono text-xs text-white/45">
            {note.author}{isAuthor && " (you)"} · {note.lecturer}, {note.year} · {note.pages} {note.pages === 1 ? "page" : "pages"} · v{note.version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StarButton noteId={note.id} starred={starred.has(note.id)} count={note.stars} boxed />
          {note.file && (
            <a href={note.file} download className="flex items-center gap-2 border border-white/15 px-3 py-2 text-sm hover:border-white">
              <Download className="size-4" /> Download
            </a>
          )}
        </div>
      </div>

      {thanked && (
        <p className="mt-6 border border-star/40 bg-star/10 px-4 py-3 text-sm">
          Thanks! You sent {note.author} {TIPS[thanked as TipItem]?.label.toLowerCase() ?? "a tip"} {thanked === "pint" ? "🍺" : thanked === "hamster" ? "🐹" : "☕"}
        </p>
      )}
      {isAuthor && tips.length > 0 && (
        <p className="mt-6 text-sm text-white/60">
          {tips.length} {tips.length === 1 ? "student has" : "students have"} thanked you · {euro(tips.reduce((t, x) => t + x.amount, 0))} in tips
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {note.file ? (
          <iframe src={note.file} title={note.title} className="h-[78vh] w-full border border-white/10 bg-white" />
        ) : (
          <div className="grid h-[50vh] place-items-center border border-white/10 text-white/40"><FileText /></div>
        )}

        <aside className="space-y-10">
          {isAuthor ? (
            <section>
              <p className="label mb-3">Suggestions to review · {pending.length}</p>
              {pending.length === 0 && <p className="text-sm text-white/40">Nothing waiting. You&apos;ll see edits other students suggest here.</p>}
              <ul className="space-y-3">
                {pending.map((x) => (
                  <li key={x.id} className="border border-white/10 bg-charcoal p-4">
                    <p className="font-mono text-[11px] text-white/45">{handle(x.proposer)} · {day(x.created)}{x.page && ` · page ${x.page}`}</p>
                    <p className="mt-2 text-sm">{x.reason}</p>
                    {x.file && <a href={x.file} target="_blank" className="mt-2 inline-block text-sm text-white/60 underline">View their fixed PDF</a>}
                    <div className="mt-3 flex gap-2">
                      <form action={review.bind(null, x.id, note.id, true)}>
                        <button className="flex items-center gap-1 bg-white px-3 py-1.5 text-sm text-black hover:bg-white/85"><Check className="size-4" /> Approve</button>
                      </form>
                      <form action={review.bind(null, x.id, note.id, false)}>
                        <button className="flex items-center gap-1 border border-white/15 px-3 py-1.5 text-sm hover:border-white"><X className="size-4" /> Reject</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section>
              <p className="label mb-3">Suggest an edit</p>
              <SuggestForm noteId={note.id} pages={note.pages} />
              <p className="mt-2 text-xs text-white/35">{note.author} reviews it. Approved edits become a new version.</p>
              {mine.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {mine.map((x) => (
                    <li key={x.id} className="flex justify-between gap-3 text-white/60">
                      <span className="truncate">{x.reason}</span>
                      <span className={x.status === "approved" ? "text-emerald-400" : x.status === "rejected" ? "text-destructive" : "text-white/40"}>{x.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section>
            <p className="label mb-3">History</p>
            <ol className="border-l border-white/15">
              {history.map((v) => (
                <li key={v.version} className="relative pb-5 pl-5 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-white/60" />
                  <p className="text-sm">v{v.version} · {v.summary}</p>
                  <p className="font-mono text-[11px] text-white/40">{v.editor} · {day(v.date)}</p>
                </li>
              ))}
            </ol>
          </section>

          {!isAuthor && <TipDialog noteId={note.id} author={note.author} supporters={tips.length} />}
        </aside>
      </div>
    </>
  )
}

// Back from Stripe Checkout: trust only Stripe's record of the session (paid + for this note), record it once.
async function confirmTip(noteId: string, sessionId: string | string[] | undefined) {
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return null
  try {
    const client = stripe()
    if (!client) return null
    const s = await client.checkout.sessions.retrieve(sessionId)
    if (s.metadata?.note_id !== noteId) return null
    return await recordPaidSession(client, s)
  } catch {
    return null
  }
}
