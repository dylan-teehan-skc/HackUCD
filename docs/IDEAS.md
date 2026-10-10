# HackUCD: Project Ideas

Real brief: `hackucd-2026-challenges.pdf`. Themes are Everyday Frustrations, Sustainability, and FinTech & Quant. Must use OpenRouter. +5 bonus for a Stripe sandbox purchase that unlocks access.

## Real-brief ideas (from my history)

- **Persona Notes**: learns how you take notes, then writes future lecture notes in your style. 2 free, then subscribe. Full plan: `IDEA_PersonaNotes.md`
  - From: Teaching_Structure (`prompt.txt` is already a hand-written persona)
- **Tariff Finder** (Sustainability + FinTech): upload an ESB smart-meter CSV, see when you actually use power, and find the cheapest tariff (day/night/EV) plus when to shift laundry and charging
  - From: Viotas (demand response, energy data pipelines)
- **Application Autopilot** (Everyday): CV + job ad → tailored bullets in your voice, cover letter, deadline tracker
  - From: Resumax + organising Job_Related_Docs
- **Society FAQ bot** (Everyday): syncs a society's docs and site, answers member questions with citations, flags gaps to the committee
  - From: Intercom Fin / Web Sync (content ingestion)
- **Scam Text Checker** (FinTech, Fraud & risk): paste a suspicious SMS or email → verdict, red flags in plain English, what to do next
  - From: MSc risk work, Dogpatch CVE Extractor
- **Housemate Bill Splitter** (FinTech): split utility bills fairly by usage and collect each share via Stripe
  - From: SubHub

---

# Earlier ideas (guessed agentic/crypto tracks, before the real brief)

Ranked within each group. "From" = the past project it builds on.

## Top picks (agentic commerce + crypto)

- **Agent Allowance: programmable stablecoin budget for agents** ⭐ safest fit across tracks
  - From: Blockchain Ticketing (Solidity), MSc risk research, SubHub
  - Fund an allowance in USDC; a smart contract enforces the rules (daily cap, approved merchants, per-transaction limit)
  - The agent pays on its own inside the rules (MPP for APIs, SPTs for shops); outside them it needs a passkey tap from the human
  - Demo: 3 automatic buys; the 4th is over the limit, Face ID prompt, approve, payment settles on-chain
  - Build: contract on testnet 2h · Stripe SPT 1.5h · passkey via WebAuthn 2h · mock agent and dashboard 1.5h (~7h)
  - Risk: check that MPP/Tempo has a public testnet; fallback is Base Sepolia + test USDC

- **Pay-per-crawl paywall: AI crawlers pay to read**
  - From: Better Alerts (flipped to the publisher side)
  - Publishers charge agents cents per article via x402/MPP; signed agents get a price, unsigned scrapers are blocked, humans read free
  - Demo: agent reads 5 articles and pays 25c; a scraper is blocked; revenue counter ticks up

- **Bounty-to-PR: coding agents paid when tests pass**
  - From: OpenAPI Doctor (auto-PRs)
  - GitHub issue has a USDC bounty in escrow; the agent opens a PR; escrow pays out automatically when CI goes green
  - Demo: post bounty, agent fixes bug, tests go green, wallet balance jumps

- **Haggle: buyer agent negotiates with merchant agent**
  - From: Standard Agent
  - Merchant sets a hidden floor price, buyer sets a max; agents negotiate, then settle via SPT or stablecoins
  - Demo: live chat of the two agents haggling; deal closes 18% under list

- **Agent-to-agent marketplace with escrow**
  - From: Tidepool (payments held, then charged), Standard Agent
  - A research agent hires a scraper and a summariser; stablecoin escrow is released only if the output passes a check; junk gets an auto-refund
  - Demo: 3 agents paid; a 4th returns junk and doesn't get paid

## More agentic commerce + crypto

- **Pay-as-you-watch: subscriptions become streaming payments**
  - From: SubHub
  - Pay per minute of real use via streaming stablecoins (Metronome + Tempo); an agent spots unused subscriptions and switches them
  - Demo: hit play and a cent counter ticks; pause and it stops

- **Agent flight recorder: verifiable purchase receipts**
  - From: WayFinder traces
  - A hash of each purchase's reasoning trace is stored on-chain; disputes can prove what the agent saw and what the human authorised
  - Demo: agent buys the wrong item, replay its reasoning, hash matches on-chain, refund justified

- **Pay-per-call API gateway**
  - From: Jentic / Standard Agent, WayFinder
  - Sits in front of any API; agents pay per call in stablecoins (MPP/x402), with a per-agent key and spend cap; WayFinder logic picks the cheapest route
  - Demo: live cost counter; the optimised agent does the same task for 40% less

- **Ticket-drop agent**
  - From: Blockchain Ticketing, Better Alerts
  - The agent watches for a drop, buys instantly from a stablecoin allowance, and receives the ticket as a token; a cap per verified human blocks scalper bots
  - Demo: countdown, agent wins the purchase, scalper bot rejected

- **Payment-rail router**
  - From: WayFinder path optimisation
  - An agent picks the cheapest and fastest way to pay (card, stablecoin, Pix, UPI) for each payment

- **Group-buy swarm**
  - From: Tidepool
  - Many people's agents pool their orders to unlock a bulk discount; payments are held and charged only if enough people join

- **Dataset marketplace**
  - From: Thymela
  - Research agents pay researchers per dataset query in micropayments

## Authentication-angled

- **SpendGuard: risk-based step-up authentication for agent spending**
  - From: MSc oversight research, WayFinder
  - Low risk passes straight through; medium risk gets a one-tap approval; high risk needs a passkey. The threshold adapts so people aren't worn down by prompts
  - Demo: agent tries an odd purchase, phone asks for Face ID, approve, payment completes

- **AgentID: checking signed agent requests at the merchant**
  - From: Nightwood (X3DH / Double Ratchet crypto)
  - Middleware in front of Stripe checkout checks each request's signature against the agent's public key; signed agents get through, unsigned bots are blocked or challenged
  - Demo: a real agent buys; a fake one is rejected live

- **Signed mandates + audit trail**
  - From: WayFinder, SubHub
  - The human signs a mandate ("up to €50 at these merchants"); each purchase is linked to its mandate and trace, which proves in a dispute whether it was authorised

- **Agent Receipts: dispute evidence**
  - From: WayFinder
  - Stores each agent purchase's decision chain and auto-generates Stripe dispute evidence when an agent buys the wrong thing

## General Stripe (non-crypto)

- **Stripe Doctor: finds and fixes risky Stripe integrations**
  - From: OpenAPI Doctor
  - Scans a repo for exposed secret keys, unverified webhooks, missing idempotency keys, test keys in prod and missing 3DS handling, then opens a fix PR
  - Demo: broken shop, 6 issues found, PR merged, double-charge bug gone

- **SubHub 2.0: subscription sharing without sharing passwords**
  - From: SubHub (won a Stripe track)
  - Each member signs in with a passkey; the bill is split via Stripe; removing someone cuts their access and billing in the same instant

- **Card-testing tripwire: catches fraud bots live**
  - From: Smart Safe, Metrics Monitoring System
  - Detects card-testing (many small payments, different cards, one device), then auto-adds a Radar rule or forces a challenge
  - Demo: launch bot attack, dashboard spikes, attack blocked, real customers still check out

- **Verified fundraising**
  - From: Tidepool
  - Organisers verify their identity with Stripe Identity; donations are held and charged only once the goal is met and the organiser is verified

- **Cost-aware agent / Conformance checker / Group-buy agent / "Buy when X" agent**
  - Earlier variants: MPP cost routing (WayFinder), an ACP endpoint tester (OpenAPI Doctor + mock agent), Tidepool group buys, a Better Alerts price trigger

## How to choose

- Machine payments / x402 / MPP → Pay-per-crawl paywall
- Agentic commerce → Haggle or Agent Allowance
- Crypto / stablecoins → Bounty-to-PR
- Trust / safety → Agent flight recorder or SpendGuard
- Developer tools → Stripe Doctor
