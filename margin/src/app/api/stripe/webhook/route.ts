import { stripe } from "@/lib/stripe"
import { recordPaidSession } from "@/lib/payouts"

// Stripe → us. Source of truth for tips (the success page also records, idempotently, for instant UI).
// Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put its whsec_ in STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const client = stripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers.get("stripe-signature")
  if (!client || !secret || !sig) return new Response("Webhook not configured", { status: 400 })

  let event
  try {
    event = client.webhooks.constructEvent(await req.text(), sig, secret) // rejects forged/replayed events
  } catch {
    return new Response("Bad signature", { status: 400 })
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await recordPaidSession(client, event.data.object)
  }
  return Response.json({ received: true })
}
