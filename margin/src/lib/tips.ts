// Tip jar options (EUR cents). Shared by the dialog (client) and the Stripe action (server).
export const TIPS = {
  coffee: { label: "A coffee", amount: 300 },
  pint: { label: "A pint", amount: 700 },
  hamster: { label: "A hamster", amount: 1500 },
} as const
export type TipItem = keyof typeof TIPS
export const euro = (cents: number) => `€${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`
