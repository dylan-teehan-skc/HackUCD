"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import { addLecturer, addNote, addSuggestion, addTopic, getNote, handle, moduleLecturers, moduleTopics, reviewSuggestion, savePdf, toggleStar } from "@/lib/library"
import { moduleName, topicSlug } from "@/lib/demo-notes"
import { summariseNote, type NoteSummary } from "@/lib/summaries"
import { stripe } from "@/lib/stripe"
import { TIPS, type TipItem } from "@/lib/tips"
import { headers } from "next/headers"
import { YEARS } from "@/lib/demo-notes"
import { routes } from "@/lib/site"

export type FormState = { error?: string; ok?: string }
const NEW = "__new" // "Add a lecturer" option in the upload form
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim()

async function student() {
  const s = await getSession()
  if (!s?.profile) redirect(routes.login)
  return s.profile
}

// Upload a PDF to one of *your* modules (verified-course rule).
export async function uploadNote(_: FormState, f: FormData): Promise<FormState> {
  const me = await student()
  const code = text(f, "module_code").toUpperCase()
  const title = text(f, "title"), topic = text(f, "topic"), year = text(f, "year")
  const isNew = text(f, "lecturer") === NEW
  const lecturer = isNew ? text(f, "lecturer_new") : text(f, "lecturer")
  if (!me.module_codes.includes(code)) return { error: "You can only upload to modules you take." }
  if (title.length < 3 || title.length > 120) return { error: "Give it a title (3–120 characters)." }
  if (!(await moduleTopics(code)).includes(topic)) return { error: "Pick a topic." }
  if (isNew ? lecturer.length < 3 || lecturer.length > 60 : !(await moduleLecturers(code)).includes(lecturer))
    return { error: isNew ? "Type the lecturer's name (3–60 characters)." : "Pick the lecturer." }
  if (!YEARS.includes(year)) return { error: "Pick the year." }
  let pdf: { url: string; pages: number }
  try { pdf = await savePdf(f.get("file") as File) } catch (e) { return { error: (e as Error).message } }
  if (isNew) await addLecturer(code, lecturer)
  const note = await addNote({
    module_code: code, topic: topic || "General", title, author: handle(me.email), owner: me.email,
    kind: "PDF", pages: pdf.pages, lecturer, year, file: pdf.url,
  })
  revalidatePath(routes.module(code))
  redirect(routes.note(note.id))
}

// Anyone in the course except the author can suggest an edit; the author reviews it.
export async function suggestEdit(_: FormState, f: FormData): Promise<FormState> {
  const me = await student()
  const id = text(f, "note_id"), reason = text(f, "reason")
  const found = await getNote(id)
  if (!found) return { error: "Note not found." }
  if (!me.module_codes.includes(found.note.module_code)) return { error: "Only students in this module can suggest edits." }
  if (found.note.owner === me.email) return { error: "This is your note. Upload a new version instead." }
  if (reason.length < 5 || reason.length > 1000) return { error: "Say what should change (5–1000 characters)." }
  const page = Number(f.get("page")) || undefined
  const upload = f.get("file") as File | null
  let file: string | undefined
  if (upload && upload.size > 0) {
    try { file = (await savePdf(upload)).url } catch (e) { return { error: (e as Error).message } }
  }
  await addSuggestion({ note_id: id, proposer: me.email, reason, page, file })
  revalidatePath(routes.note(id))
  return { ok: "Sent to the author for review." }
}

export async function review(suggestionId: string, noteId: string, approve: boolean) {
  const me = await student()
  await reviewSuggestion(suggestionId, approve, me.email)
  revalidatePath(routes.note(noteId))
}

// Any student taking the module can add a topic; it appears for everyone in the module.
export async function createTopic(_: FormState, f: FormData): Promise<FormState> {
  const me = await student()
  const code = text(f, "module_code").toUpperCase()
  const name = text(f, "name").replace(/\s+/g, " ")
  if (!me.module_codes.includes(code)) return { error: "You can only add topics to modules you take." }
  if (name.length < 2 || name.length > 60) return { error: "Topic names are 2–60 characters." }
  try { await addTopic(code, name) } catch (e) { return { error: (e as Error).message } }
  redirect(routes.topic(code, topicSlug(name)))
}

// AI summary of one PDF (OpenRouter): what it covers. Students in the module only.
export async function generateNoteSummary(noteId: string): Promise<{ summary?: NoteSummary; error?: string }> {
  const me = await student()
  const found = await getNote(noteId)
  if (!found) return { error: "Note not found." }
  if (!me.module_codes.includes(found.note.module_code)) return { error: "Only students in this module can generate summaries." }
  try {
    return { summary: await summariseNote(found.note, moduleName(found.note.module_code) ?? found.note.module_code) }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// Star / unstar a note (stars are your favourites and feed the ranking).
export async function star(noteId: string): Promise<{ starred?: boolean; count?: number; error?: string }> {
  const me = await student()
  try {
    const found = await getNote(noteId)
    if (!found) return { error: "Note not found." }
    if (!me.module_codes.includes(found.note.module_code)) return { error: "Only students in this module can star it." }
    const r = await toggleStar(me.email, noteId)
    revalidatePath(routes.favourites)
    return { starred: r.starred, count: r.count }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// Tip the author via Stripe Checkout (sandbox). Returns the hosted checkout URL to redirect to.
export async function startTip(noteId: string, item: TipItem): Promise<{ url?: string; error?: string }> {
  const me = await student()
  const tip = TIPS[item]
  if (!tip) return { error: "Pick a coffee, a pint or a hamster." }
  const found = await getNote(noteId)
  if (!found) return { error: "Note not found." }
  if (found.note.owner === me.email) return { error: "You can't tip your own notes." }
  let client
  try { client = stripe() } catch (e) { return { error: (e as Error).message } }
  if (!client) return { error: "Payments aren't set up: add STRIPE_SECRET_KEY (sk_test_…) to .env.local and restart." }
  const h = await headers()
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
  const back = `${origin}${routes.note(noteId)}`
  try {
    const session = await client.checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: tip.amount, product_data: { name: `${tip.label} for ${found.note.author}`, description: `Thanks for "${found.note.title}" on Margin` } } }],
      metadata: { note_id: noteId, item, from: me.email },
      customer_email: me.email,
      success_url: `${back}?tip_session={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
    })
    return { url: session.url ?? undefined }
  } catch (e) {
    return { error: `Stripe: ${(e as Error).message}` }
  }
}

// Author payout setup (Stripe Connect, Accounts v2): create their recipient account once, then send them
// to Stripe-hosted onboarding. Held tips are released when they come back (see /me).
export async function setupPayouts() {
  const me = await student()
  let client
  try { client = stripe() } catch (e) { return { error: (e as Error).message } }
  if (!client) return { error: "Payments aren't set up yet." }
  const { connectedAccount, saveConnectedAccount } = await import("@/lib/library")
  const h = await headers()
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
  let url: string
  try {
    let account = await connectedAccount(me.email)
    if (!account) {
      const a = await client.v2.core.accounts.create({
        contact_email: me.email, display_name: handle(me.email), dashboard: "express",
        identity: { country: "ie", entity_type: "individual" },
        // EU accounts: Stripe requires card_payments alongside stripe_transfers.
        configuration: {
          merchant: { capabilities: { card_payments: { requested: true } } },
          recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
        },
        defaults: { currency: "eur", responsibilities: { fees_collector: "application", losses_collector: "application" } },
      })
      account = a.id
      await saveConnectedAccount(me.email, account)
    }
    const link = await client.v2.core.accountLinks.create({
      account,
      use_case: { type: "account_onboarding", account_onboarding: { refresh_url: `${origin}${routes.me}`, return_url: `${origin}${routes.me}?connected=1` } },
    })
    url = link.url
  } catch (e) {
    const msg = (e as Error).message
    return { error: msg.includes("permission") ? "This Stripe key can't create connected accounts. Use a full test secret key (sk_test_…) with Connect enabled." : `Stripe: ${msg}` }
  }
  redirect(url)
}
