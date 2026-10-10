import Stripe from "stripe"

// Sandbox/test keys only (sk_test_, rk_test_ or sandbox rkcs_test_). Returns null when payments aren't set up.
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!/^(sk|rk|rkcs)_test_/.test(key)) throw new Error("Use a Stripe test/sandbox key. Real payments are off for this demo.")
  return new Stripe(key)
}
