import type Stripe from "stripe"
import { addTip, connectedAccount, getNote, markTransferred, tipsForAuthor } from "./library"

export const AUTHOR_SHARE = 0.9 // author gets 90%, Margin keeps 10%

// Record a paid Checkout Session as a tip (idempotent), then try to pay the author.
export async function recordPaidSession(client: Stripe, s: Stripe.Checkout.Session) {
  if (s.payment_status !== "paid" || !s.metadata?.note_id) return null
  const found = await getNote(s.metadata.note_id)
  if (!found?.note.owner) return null
  const pi = typeof s.payment_intent === "string" ? await client.paymentIntents.retrieve(s.payment_intent) : s.payment_intent
  const charge = typeof pi?.latest_charge === "string" ? pi.latest_charge : pi?.latest_charge?.id
  await addTip({ session: s.id, note_id: found.note.id, author: found.note.owner, from: s.metadata.from ?? "", item: s.metadata.item ?? "coffee", amount: s.amount_total ?? 0, charge })
  await releaseHeldTips(client, found.note.owner).catch((e) => console.error("tip transfer failed:", e.message)) // stays held; /me retries
  return s.metadata.item ?? "coffee"
}

// Can this connected account receive transfers yet?
export async function payoutsReady(client: Stripe, accountId: string) {
  const a = await client.v2.core.accounts.retrieve(accountId, { include: ["configuration.recipient"] })
  return a.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active"
}

// Separate charges & transfers: send the author's share of every held tip, tied to its original charge.
export async function releaseHeldTips(client: Stripe, author: string) {
  const account = await connectedAccount(author)
  if (!account || !(await payoutsReady(client, account))) return 0
  let sent = 0
  for (const t of await tipsForAuthor(author)) {
    if (t.transfer || !t.charge) continue
    // A transfer must use the currency the charge settled in (the platform's, e.g. €7 → $7.84 on a US platform).
    const bt = (await client.charges.retrieve(t.charge, { expand: ["balance_transaction"] })).balance_transaction as Stripe.BalanceTransaction
    const tr = await client.transfers.create(
      { amount: Math.floor(bt.amount * AUTHOR_SHARE), currency: bt.currency, destination: account, source_transaction: t.charge, metadata: { note_id: t.note_id, tip_session: t.session } },
      { idempotencyKey: `tip-transfer-${t.session}-${bt.currency}` }, // never pay the same tip twice
    )
    await markTransferred(t.session, tr.id)
    sent++
  }
  return sent
}
