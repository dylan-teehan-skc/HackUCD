# How Margin works

Plain-English guide to the whole app: what each part does, how data flows, and where the code lives.
For the decision history see `DECISIONS.md`; for the agent handoff see `PROJECT_CONTEXT.md`.

---

## 1. What Margin is

A notes platform for university students. Three ideas:

| Idea | What the student does | Where |
|---|---|---|
| **Share** | Upload PDF notes to the modules they take; others star them, suggest edits, and tip the author | Library (`/modules`) |
| **Rank** | The most-starred notes rise to the top of each topic | Topic pages |
| **Condense** | Drop in lecture slides and get notes written in *their own* handwriting style | `/condense` |

It's built for HackUCD 2026. The two external services it uses are **OpenRouter** (AI) and **Stripe** (payments).

---

## 2. Tech stack

| Layer | What we use | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Server Actions, `cacheComponents`) | Pages and backend in one project |
| UI | **Tailwind v4 + shadcn/ui**, lucide icons, framer-motion | Fast, consistent dark design |
| Fonts | Archivo (headings), Geist / Geist Mono (body / labels), Kalam (handwritten notes) | |
| AI | **OpenRouter** (free models) via plain `fetch` | One key, many models, automatic fallback |
| Payments | **Stripe** (Checkout, Connect, webhooks) via the `stripe` SDK | Card payments + paying authors |
| PDFs | `unpdf` (text extraction) | |
| PowerPoint | `jszip` (reads text out of `.pptx`) | |
| Database | **JSON files in `.data/`** (mock) | Hackathon speed; swap for Supabase later |

---

## 3. Folder map

```
margin/
  src/
    app/                     pages (each folder = a URL) + server actions
      page.tsx               /            landing page
      login/                 /login       sign up / log in (+ actions.ts)
      modules/               /modules     your modules (library home)
      m/[code]/              /m/COMP30760         topics in a module
      m/[code]/[topic]/      /m/COMP30760/clustering   ranked notes in a topic
      n/[id]/                /n/n1        one note: PDF viewer, suggest edits, history, tips
      favourites/            /favourites  notes you've starred
      me/                    /me          "Your tips": money you've earned + payout setup
      condense/              /condense    Condense workspace (+ actions.ts)
      library-actions.ts     server actions for the library (upload, star, suggest, tip, payouts…)
      api/files/[name]/      serves uploaded files (signed-in only)
      api/stripe/webhook/    Stripe tells us a payment succeeded
    components/              UI pieces (landing/, library/, condense/, login/, layout/, ui/ = shadcn)
    lib/                     logic with no UI (see below)
    proxy.ts                 route guard: signed-out users get sent to /login
  public/
    notes/                   49 real open lecture-note PDFs (MIT OCW) used as seed notes
    examples/                5 real slide decks + the notes made from them (Condense examples)
    media/                   landing page images
  .data/                     the "database" (gitignored, created on first run)
  docs/                      this file, DECISIONS.md, PROJECT_CONTEXT.md
```

**`src/lib/` (the brains):**

| File | Job |
|---|---|
| `session.ts` | Who is logged in (an httpOnly cookie) |
| `student-email.ts` | Which email domains count as students |
| `password.ts` | Hash/check passwords (scrypt) |
| `mock-db.ts` | Users table (`.data/users.json`) |
| `ucd.ts`, `demo-data.ts` | UCD subject areas, courses, module codes |
| `demo-notes.ts` | The 49 seed notes, module names, topics, lecturers |
| `library.ts` | Notes, versions, suggestions, stars, tips, connected accounts (`.data/library.json`) |
| `summaries.ts` | ✨ AI summary of one PDF (cached in `.data/summaries.json`) |
| `condense.ts` | Everything Condense: read slides, read photos, your style, write notes (`.data/condense.json`) |
| `openrouter.ts` | The one function that talks to OpenRouter: `chatJson()` |
| `stripe.ts` | Creates the Stripe client (refuses live keys) |
| `tips.ts` | Tip prices: coffee €3, pint €7, hamster €15 |
| `payouts.ts` | Records paid tips and sends authors their 90% |

---

## 4. Accounts and login

1. **Sign up**: student email + password → we "send" a 6-digit code (demo code: `123456`) → you pick your **subject area → course → modules**.
2. Only student emails work: `@ucdconnect.ie`, `@tcd.ie`, `@mail.dcu.ie`, `@studentmail.ul.ie`, `@umail.ucc.ie`, `@universityofgalway.ie`.
3. The password is hashed with **scrypt** (salted) and stored in `.data/users.json`. Never stored in plain text.
4. A **session cookie** (httpOnly, so JavaScript can't read it) remembers you.
5. `proxy.ts` blocks `/modules`, `/m/*`, `/n/*`, `/favourites`, `/me`, `/condense` unless you're signed in, and sends signed-in users away from `/login`.

**Your modules = your permissions.** You can only upload to, summarise in, or condense for modules you picked at sign-up ("verified by course").

Test accounts (password `(local test password)`): `dylan@`, `mark@`, `james@`, `demo.student@`, `aoife.m@`, `hi@` (all `@ucdconnect.ie`).

---

## 5. The library

**Data model** (`library.ts`):

```
Note        id, module, topic, title, author, owner email, lecturer, year, file, stars, version
Version     every approved edit makes a new version of the note's PDF
Suggestion  someone proposes a change → author approves (new version) or rejects
Stars       per student; your stars are also your Favourites
Tip         a paid tip: who, which note, amount, Stripe charge id, transfer id once paid out
```

**How a student uses it:**
1. `/modules` → pick a module → pick a topic.
2. Notes are listed **Most starred** first (or **New**), filterable by **Lecturer** and **Year**, 5 per page.
3. On each note: ⭐ star it, ⬇ download it, ✨ get an AI summary.
4. **Upload notes** (PDF ≤ 20 MB): we check the file really is a PDF (first bytes `%PDF-`), give it a random name, and store it in `.data/files/`.
5. On a note's page: **Suggest an edit** (reason + optional replacement PDF). The author sees it, approves or rejects. Approving creates a new version; **History** lists them all.
6. Students can add **new topics** and **new lecturers** to a module.

---

## 6. OpenRouter (the AI)

**What it is:** a single API that gives access to many AI models from different companies. We use the **free** ones. If the first model is busy, OpenRouter tries the next in our list (max 3).

**The one helper:** `chatJson(messages, models?, timeout?)` in `src/lib/openrouter.ts`
- Sends the messages, asks for a **JSON** reply, parses it, retries once if the reply is broken.
- Turns errors into plain messages ("All the free AI models are busy…", "rejected the API key", "out of credits").

**Models:**
- Text: `nvidia/nemotron-3-super-120b-a12b:free` → fallbacks `dots-3-note-preview:free`, `gemma-4-31b-it:free`
- Vision (reading photos): `dots-studio/dots-3-note-preview:free` → `gemma-4-31b-it:free` → `gemma-4-26b-a4b-it:free`

**Where it's used (4 places):**

| Feature | Input | AI returns | Code |
|---|---|---|---|
| ✨ **Note summary** | First 30k characters of a PDF | Overview, what it covers, who it's good for | `summaries.ts` |
| **Reading handwriting** | A photo of your notes | A transcript, with each line's ink colour (`[red]`, `[blue]`) | `transcribe()` in `condense.ts` |
| **Your style** | Your transcribed notes | 3–5 traits about *how* you write, each with a quote | `refreshStyle()` in `condense.ts` |
| **Condense** | Slide text + your style traits | Structured notes (see §7) | `condense()` in `condense.ts` |

Results are saved so we never pay (in time) for the same work twice: summaries are cached per note version, Condense outputs are stored.

**Limits of free models:** rate limits and queues. Text calls take ~5–35 s, a photo ~30 s or more (sometimes times out → "Try again").

The key lives in `.env.local` as `OPENROUTER_API_KEY` (never committed).

---

## 7. Condense

Three tabs on `/condense` (the tab is in the URL: `?tab=notes|upload|outputs`).

### Your notes (teach it your style)
1. Pick several files at once: **photos** of handwritten pages (JPG/PNG/HEIC), PDFs, PowerPoints or `.txt`.
2. They're **saved instantly** and shown as cards. Photos show **Reading…**.
3. In the background (Next's `after()`), the vision model reads the photos **2 at a time** and keeps the ink colours. The page refreshes itself every 4 s until done.
4. Then the AI reads all your notes and writes **Your style**: e.g. *"Intuition before formulas: 'dense layer on an image would be crazy'"*.
5. Click any card to see the photo full size next to "What Margin read".

### Upload (slides → notes)
1. Drop a **PDF or .pptx** (≤ 20 MB, first 60 slides used).
2. Text comes out per slide: `unpdf` for PDF; for PPTX we unzip it with `jszip` and read the `<a:t>` text tags in `ppt/slides/slideN.xml`.
3. Choose module, length (short / standard / detailed), and **Write it in my style**.
4. The AI gets the slide text + your style traits + rules from `Teaching_Structure/prompt.txt` (intuition first, ask-yourself questions, casual tone, no invented facts).
5. It returns JSON made of typed items: `def`, `point` (with `↳` sub-points), `question`, `rule`, `aside`, plus `==highlight==` marks, a "worth remembering" box and quick-check questions.

### Outputs (show what came out)
- **Left:** your slides (the original PDF, or slide cards for PPTX) + download.
- **Right:** the notes on a **dot-grid paper page** in the ink system:

| Ink | Means |
|---|---|
| Red | Headers, the term being defined, "?" self-questions |
| Blue | Normal explanation |
| Black (boxed) | The rule / takeaway |
| Green | Analogies and side remarks |
| Yellow highlighter | The one phrase to remember |

- **Examples:** 5 real lecture decks with the notes made from them (`public/examples/`), shown to everyone and labelled "Example". These were made by Claude using `prompt.txt` (higher quality than the free in-app model). The decks are course material: local demo only.

---

## 8. Stripe (payments)

### Key ideas
- **Stripe** takes card payments. Card numbers only ever go to Stripe's pages, never to Margin.
- **Checkout**: a Stripe-hosted payment page. We create a "session" and send the student there.
- **Webhook**: Stripe calls our server (`/api/stripe/webhook`) to say "this payment succeeded". We check its **signature** so nobody can fake it.
- **Connect**: Stripe's marketplace feature. Margin is the **platform**; every author gets a **connected account** (their own Stripe account, created by us, verified by Stripe). We tell Stripe how much to send to whom; Stripe pays their bank.
- **Test mode only**: `stripe.ts` refuses any key that isn't `sk_test_` / `rk_test_`. Test card: `4242 4242 4242 4242`.

### Flow 1: author sets up payouts (once)
1. Author opens `/me` → **Set up payouts**.
2. We create a connected account (Accounts v2) asking for `stripe_transfers` (receive money from us) and `card_payments` (Stripe requires it for Irish accounts).
3. We save `author email → acct_…` in `library.json`.
4. We create an **account link** → the author fills in identity + bank details on **Stripe's** site (test mode accepts test data).
5. Stripe sends them back to `/me?connected=1`.

### Flow 2: a student tips
1. On a note: **Leave a tip** → coffee €3 / pint €7 / hamster €15. (You can't tip your own notes.)
2. We create a Checkout session with the note id in its metadata → student pays on Stripe.
3. Money lands in **Margin's** Stripe balance.

### Flow 3: we record it
1. Stripe → webhook `checkout.session.completed` (also checked when the student lands back on the note).
2. `recordPaidSession()` saves the tip with its **charge id**, keyed by session id so it's never saved twice.

### Flow 4: the author gets 90%
1. `releaseHeldTips()` checks the author's account can receive transfers.
   - Not set up → tip stays **Held** ("Waiting for you" on `/me`).
   - Ready → we create a **transfer** of 90% to their account, linked to the original charge (`source_transaction`) and protected by an **idempotency key** (Stripe will never send it twice).
2. Margin keeps 10% (minus Stripe's fee).
3. Held tips are retried every time the author opens `/me`.

```
Student card ──€7──▶ Margin's Stripe balance
                         ├── 90% transfer ──▶ author's connected account ──▶ author's bank
                         └── 10% stays with Margin
```

**Currency note:** our test platform account is US-based, so Stripe converts €7 → ~$7.84 on arrival and the transfer is sent in USD; the Irish author's account converts back to euro. Students only ever see euro.

### Running Stripe locally
Stripe can't reach `localhost`, so the Stripe CLI relays events:
```
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded \
  --forward-to localhost:3000/api/stripe/webhook
```
Its `whsec_…` signing secret goes in `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### Where to see the money
- Payments: https://dashboard.stripe.com/test/payments
- Transfers to authors: https://dashboard.stripe.com/test/connect/transfers
- Connected accounts: https://dashboard.stripe.com/test/connect/accounts/overview

---

## 9. Where data lives

| File | Contents |
|---|---|
| `.data/users.json` | Accounts: hashed password + profile (course, modules) |
| `.data/library.json` | Uploaded notes, versions, suggestions, topics, lecturers, stars, tips, connected accounts |
| `.data/summaries.json` | Cached ✨ summaries |
| `.data/condense.json` | Your notes (samples), your style, Condense outputs |
| `.data/files/` | Uploaded PDFs, slide decks and note photos (random UUID names) |

All of `.data/` is gitignored. Deleting it resets the app (seed notes and examples come back from `public/`).

---

## 10. Security choices

- Student-email-only sign-up, code-verified before the account is saved.
- Passwords: salted scrypt + timing-safe compare; generic "email or password is incorrect" error.
- httpOnly session cookie; route guard in `proxy.ts`; redirects only to same-site paths.
- Uploads: checked by their real bytes (not the file name), size-capped, random names, served only to signed-in users, no path tricks (`/api/files/` only accepts `uuid.pdf|jpg|pptx`).
- Stripe: test keys only, signed webhooks, idempotent tips and transfers, hosted pages for cards and ID.
- Secrets only in `.env.local` (never committed, never printed).

---

## 11. Running it

```bash
cd ~/MyRepos/HackUCD/margin
npm run dev                         # http://localhost:3000
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded \
  --forward-to localhost:3000/api/stripe/webhook   # for tips
ngrok http 3000                     # optional: share with another laptop
```

`.env.local` needs: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (optional), `STRIPE_SECRET_KEY` (sk_test_…), `STRIPE_WEBHOOK_SECRET`.

---

## 12. Not built yet

1. **Condense subscription**: 2 free condenses, then €3.99/month via Stripe Checkout (subscription mode). Clearest route to the +5 Stripe bonus.
2. **Publish to library** and **Download PDF** for Condense outputs.
3. **Supabase** to replace `.data/` before any real deploy (Vercel wipes local files).
4. Remove course-material decks from `public/examples/` and add an MIT OCW credit before going public.
