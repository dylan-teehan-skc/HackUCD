# HackUCD: Possible Stripe Tracks

Track setter is on Stripe's authentication team. Best guess is agentic commerce + crypto.

## Most likely (agentic commerce + crypto)

- **Agentic commerce**: agents that discover, compare and buy
  - Stripe tech: Link agent wallet, Shared Payment Tokens (SPTs), ACP checkout, Agentic Commerce Suite
- **Machine payments**: agents paying APIs or other agents per call
  - Stripe tech: Machine Payments Protocol (MPP) on Tempo, x402, streaming payments (Metronome + Tempo)
- **Stablecoin payments**: accepting and sending stablecoins
  - Stripe tech: stablecoins via Link, Bridge, stablecoin cards (expanding to 100+ countries, announced 5 Oct 2026)
- **Open / best use of Stripe**: anything combining the above

## Authentication-flavoured (the track setter's team)

- **Step-up authentication for agents**: a risky purchase means the human confirms with a passkey or 3DS
- **Agent identity**: is this a real agent or a bot? Agents sign their requests (Visa Trusted Agent Protocol, Web Bot Auth / RFC 9421)
- **Delegated, scoped, revocable consent**: like OAuth permissions, but for spending
- **Passkeys / passwordless**: Link and Visa Payment Passkeys
- **Proving authorisation / liability**: who pays when an agent buys the wrong thing

## From the pasted list

- Merchant-side agent readiness (ACP endpoints, SPTs in PaymentIntents, accurate inventory)
- Agent-side shopping and purchasing (ranking, negotiation, price tracking, "buy when X")
- Trust, fraud and authorisation (spending policies, anomaly detection, audit trails, disputes)
- Agent wallets and delegated spending (budgets, family/team delegation, revocation UX)
- Machine-to-machine and streaming payments
- Protocol interoperability (ACP, Google UCP, Visa, Mastercard)
- Developer experience (local ACP sandboxes, mock agents, debugging dashboards)

## General hackathon tracks

- Trust, safety and fraud
- Developer tools
- Subscriptions, billing and usage-based payments
- Fintech for good / open track

## Key context (Stripe Sessions, 29 Apr 2026)

- 288 launches, mostly AI commerce
- Agent spending limits are announced but **not shipped yet**, which leaves a gap to build in
- Tempo (payments blockchain) went live March 2026
- Google UCP partnership; Meta native checkout in ads
