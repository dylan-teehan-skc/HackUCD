# MARGIN: Full Project Context (handoff)

> This is a complete dump of everything built so far, for any human or AI agent picking this up.
> Read this first, then `docs/DECISIONS.md` (dated decision log, more detail) and `AGENTS.md`.
> Last updated: 2026-10-10 (HackUCD day).

---

## 1. What this is

**Margin** is a course-verified notes platform for university students (UCD first; UL, Trinity, DCU, UCC and Galway emails also accepted).

- Students in a module **share PDF notes** per topic.
- Others **star** them, which both adds them to their **Favourites** and ranks them.
- Anyone in the module can **suggest an edit**; the author approves or rejects it, and every version is kept.
- **AI summaries (OpenRouter)** of each PDF: one click shows what the PDF covers.
- **Tip the author** (☕ €3 / pint €7 / 🐹 €15) through **Stripe Checkout**. 90% goes to the author through **Stripe Connect**; Margin keeps 10%. Tips are held until the author sets up payouts.
- Planned: **Condense**, which turns lecture slides into notes in your own style, with a paid subscription.

Built for **HackUCD 2026** (Stripe-sponsored). The brief is in `../docs/hackucd-2026-challenges.pdf`. Key scoring:
- Five criteria worth /10 each: Users first, Craft, Urgency/focus, Stay curious, AI usage via OpenRouter (mandatory).
- **+5 Stripe bonus**: a real sandbox purchase or subscription *of your tool*, recognised in-app.

Theme fit: *Everyday Frustrations → Learning and revision*.

## 2. Where things are

```
~/MyRepos/HackUCD/
  docs/                      planning docs (brief PDF, BRIEF, UI_PLAN, BACKEND_PLAN, IDEAS, TRACKS, IDEA_*)
  Teaching_Structure/        Python notes-writing tool (prompt.txt = the "persona" brief, notes.css) — reused for visuals / future Condense
  margin/                    THE APP (Next.js)
    AGENTS.md / CLAUDE.md    agent instructions → read docs/DECISIONS.md first
    docs/DECISIONS.md        dated decision log
    docs/PROJECT_CONTEXT.md  this file
    .env.local               secrets (gitignored): OPENROUTER_*, STRIPE_* — never commit/print
    .data/                   mock database (gitignored): users.json, library.json, summaries.json, files/
    public/media/            landing images (hero-library-v3.jpg, condense-notes-v3.png, ucd-crest.svg, unis/*)
    public/notes/<CODE>/     49 real open lecture-note PDFs (MIT OCW, CC BY-NC-SA 4.0)
    images/                  source Unsplash hero photo
```

## 3. Stack

- **Next.js 16.4 (App Router)**, TypeScript, React 19.
  - `next.config.ts` sets `cacheComponents: true`. Pages must read cookies, params or searchParams inside `<Suspense>`, and no `Date.now()` in server components.
- **Tailwind v4** and **shadcn/ui** (style `radix-nova`; `cn` comes from the `cn` package). Components used: button, card, input, input-otp, label, checkbox, select, dialog, textarea, separator.
- **framer-motion** for scroll fades only. **lucide-react** icons.
- Fonts: **Archivo** (display, stretched), **Geist** (body), **Geist Mono** (labels via the `label` utility).
- **unpdf** for PDF text extraction. **stripe** (node SDK v23). OpenRouter via plain `fetch`.
- `src/proxy.ts` is Next 16's renamed middleware (route protection).
- Backend = Next **Server Actions + route handlers**, with a **JSON-file mock DB** in `.data/`. There's no Supabase yet; the planned swap is documented in DECISIONS.md and `../docs/BACKEND_PLAN.md`.

## 4. Design system

- Anduril-inspired: **pure black**, huge uppercase Archivo headlines, thin lines, small mono labels, a lot of space.
- **Charcoal cards**: `bg-charcoal` #1f1f22, hover #2a2a2e (tokens in `globals.css`). Used for module cards, topic cards, note rows, the tip box and summary panels.
- One accent, `--star` (amber), used for stars, "AI" sparkles and the thank-you banner.
- Dark only (`class="dark"` on `<html>`). Square corners on primary buttons (white fill, black text).
- Landing hero = blurred Unsplash photo of a library (it's Trinity's Long Room).

## 5. Pages / routes

| Route | Who | What |
|---|---|---|
| `/` | everyone | Landing: hero (CTA becomes "Go to your modules" when signed in), stats strip (demo numbers), **Share** (2×2 UCD/UL/TCD/DCU logos), **Rank** (mini ranked list), **Condense** (template PPTX slide → notes page), "how a note goes live" timeline, Anduril-style footer |
| `/login` | signed out only (signed-in → `/modules`) | One card with **Log in / Sign up** tabs. Log in = email + password. Sign up = email + password → 6-digit code (demo code **123456**; UCD crest shows on this step for @ucdconnect.ie) → **Subject area** (UCD's 11 real areas + "Not sure? Search all courses") → **Course** (all ~135 real UCD courses) → **Modules** (suggested + type your own codes). Back links on every step. |
| `/modules` | signed in | "Your modules": charcoal card per module with note count, stars and last updated |
| `/m/[code]` | signed in | Module name, **+ New topic**, **Upload notes**, grid of topic cards (count + top note) |
| `/m/[code]/[topic]` | signed in | Topic: Upload, sort tabs **Most starred** (default) / New, **Lecturer** and **Year** dropdown filters, note rows (5 per page, pagination). Each row has **✨ AI summary**, download and **★ star**. |
| `/n/[id]` | signed in | Note page: title, meta, ★ star, Download, embedded PDF; side panel: **Suggest an edit** (others) or **Suggestions to review** with Approve/Reject (author), **History** timeline, then "Did you find these notes helpful?" → **Leave a tip** box → pop-up (coffee/pint/hamster) → Stripe Checkout → thank-you banner |
| `/favourites` | signed in | Your starred notes grouped by module |
| `/me` | signed in | **Your tips**: paid vs waiting totals, tips list (Held/Paid), **Set up payouts / Finish setup** (Stripe Connect onboarding) |
| `/condense` | signed in | Condense: Your notes (style from photos/notes) · Upload (PDF/PPTX → notes) · Outputs (slides beside notes, plus 5 examples). See HOW_IT_WORKS.md §7 |
| `/api/files/[name]` | signed in | Serves uploaded PDFs (UUID names only; 401 if signed out) |
| `/api/stripe/webhook` | Stripe | Signature-verified; records paid tips and triggers payouts |
| any other | — | Styled 404 (`app/not-found.tsx`) |

The nav (`components/layout/nav.tsx`, on every page) shows Library · Favourites · Condense, plus **Your tips**, your email and Log out when signed in (otherwise Log in).

## 6. Data model (mock DB in `.data/`)

- `users.json` (`src/lib/mock-db.ts`): `email → { password_hash (scrypt, salted), profile: { email, university, area_id, course, module_codes[] } | null }`.
- Session: httpOnly cookie `margin_session` = `{ email, university, profile }` (`src/lib/session.ts`). Passwords are never stored in the cookie.
- `library.json` (`src/lib/library.ts`):
  - `notes[]` = student uploads (seed notes live in code)
  - `versions{noteId: Version[]}` = append-only history
  - `suggestions[]` = pending/approved/rejected edits
  - `topics{code: string[]}`, `lecturers{code: string[]}` = student-added
  - `stars{email: noteId[]}` = favourites and star counts
  - `tips[]` = `{ session, note_id, author, from, item, amount, charge, transfer?, date }`
  - `accounts{email: stripeAccountId}` = Connect accounts
- `summaries.json`: AI summary per `note:<id>@<version>`.
- `files/`: uploaded PDFs.
- Seed data (`src/lib/demo-notes.ts`): `moduleMeta` (trimester, **fictional** lecturers, topics) plus 49 notes.
  - All notes are **real MIT OCW PDFs** with their real lecture titles: ML = 6.867 + 6.034 neural nets + exam solutions; Distributed Systems = 6.824; Algorithms = 6.006.
  - Uploader handles, stars, views, lecturers and years are fictional.
  - Each seed note's `owner` = `<handle>@ucdconnect.ie`, so **signing up as e.g. aoife.m@ucdconnect.ie makes you that author**.
- `src/lib/ucd.ts`: UCD's 11 subject areas and all courses (scraped 2026-10-10). `src/lib/demo-data.ts`: suggested modules per course, `MODULE_CODE` regex, `DEMO_CODE`.

## 7. AI (OpenRouter)

- `src/lib/openrouter.ts`: `chatJson()` sends a plain fetch to OpenRouter in JSON mode, with one retry and friendly errors for a missing key, 401, 402 and 429.
- **Free models**: primary `nvidia/nemotron-3-super-120b-a12b:free`, with fallbacks `dots-studio/dots-3-note-preview:free` and `google/gemma-4-31b-it:free` (OpenRouter's `models` array allows **max 3**).
- **Per-PDF summary** (`src/lib/summaries.ts`, `generateNoteSummary` action, ✨ in `note-row.tsx`):
  1. `unpdf` extracts the text (first 30k characters).
  2. Prompt: use ONLY the text.
  3. Returns JSON `{overview, covers[], good_for}`.
  4. Cached per note version, shown in an expandable panel under the row, with a "may miss equations/diagrams" note.
- Gotcha: a key pasted as `Sk-or-…` (auto-capitalised) gets a 401. Keys start with lowercase `sk-or-v1-`.

## 8. Stripe

- Plugin `stripe@claude-plugins-official` is installed (it bundles the `https://mcp.stripe.com` MCP server). To use the `stripe_implementation_planner`, run `/reload-plugins` and then authenticate via `/mcp`.
- `src/lib/stripe.ts`: accepts **test keys only** (`sk_test_`, `rk_test_`, `rkcs_test_`) and refuses live keys.
- **Tips** (`components/library/tip-dialog.tsx`, `startTip` action):
  1. Checkout Session, `mode: payment`, inline EUR price, metadata `{note_id, item, from}`.
  2. Return to `/n/<id>?tip_session=…`.
  3. The server **retrieves the session from Stripe** and records the tip only if paid.
- **Webhook** `/api/stripe/webhook`: `checkout.session.completed` and `async_payment_succeeded`, signature-verified. Run locally with `stripe listen --forward-to localhost:3000/api/stripe/webhook` (its `whsec_` goes in `STRIPE_WEBHOOK_SECRET`). Both paths are idempotent by session id.
- **Connect payouts** (`src/lib/payouts.ts`, `/me`, `setupPayouts` action):
  - **Separate charges & transfers.** The platform charges; tips are **held** until the author has a connected account with `recipient.stripe_balance.stripe_transfers` **active**; then 90% is transferred with `source_transaction` and idempotency key `tip-transfer-<session>`.
  - Accounts **v2** recipient account (express dashboard, IE, EUR, application collects fees/losses), with v2 account links for onboarding.
  - In the Stripe dashboard, the Connect business model is **"You collect payments and pay recipients"** (marketplace).
- **Current status:**
  - A CLI-created sandbox `acct_…` (expires 2026-10-17; claiming failed because the owner's Stripe account isn't activated) took one real paid test tip (pint €7 on note n1 → aoife.m, held €6.30).
  - **Its restricted key can't create connected accounts.** Next step: make a new Stripe account, enable Connect in test mode (marketplace), put its `sk_test_…` in `.env.local`, restart, re-run `stripe listen`, then test the payout as aoife.m.
- Test card **4242 4242 4242 4242** (any future date, any CVC); decline card 4000 0000 0000 0002.
- Webhooks only reach you locally while `stripe listen` is running.

## 9. Accounts for testing

| Email | Password | Notes |
|---|---|---|
| demo.student@ucdconnect.ie | (local test password) | CS with Data Science; COMP30760, COMP30220, COMP20230, MATH20010; uploaded "My perceptron summary" (v2 after an approved suggestion) |
| second.student@ucdconnect.ie | (local test password) | Takes COMP30760; suggested the approved edit |
| aoife.m@ucdconnect.ie | (local test password) | Owner of seed notes such as n1 (Neural nets); old sandbox tip cleared 2026-10-10; use for the payout test |
| dylan@ucdconnect.ie, mark@ucdconnect.ie, james@ucdconnect.ie | (local test password) | Same course and modules as demo.student. dylan was reset to this password on 2026-10-10 |

Sign-up code is always **123456**.

## 10. Run it

```bash
cd ~/MyRepos/HackUCD/margin
npm run dev                       # http://localhost:3000
stripe listen --api-key "$STRIPE_SECRET_KEY" --forward-to localhost:3000/api/stripe/webhook   # for tip webhooks
npx tsc --noEmit                  # typecheck (slow first run because of the Stripe types)
node --test src/lib/student-email.test.ts src/lib/password.test.ts
```

Env (`.env.local`): `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

## 11. Security / correctness choices worth knowing

- Student-only sign-up is checked **server-side** (`universityFor`, with a test covering it).
- Passwords: salted scrypt with a timing-safe compare. Wrong logins get one generic error.
- Proxy protects `/modules`, `/m/*`, `/n/*`, `/favourites`, `/me` and `/condense`. `next` redirects are same-site only.
- Uploads: must be enrolled in the module, `%PDF-` magic bytes, ≤ 20 MB (Server Action body limit raised to 21 MB). Files are served only to signed-in users, with UUID filenames (no path traversal).
- Only the author can review suggestions; you can't suggest on your own note or tip yourself.
- Stripe: test keys only; payments are trusted only from Stripe's own record (retrieve or verified webhook); transfers are idempotent.

## 12. What was decided against / removed (so nobody re-adds it)

- **Lecture slides** in modules: removed. Notes only.
- "**Best**" (Wilson score) sort: removed. Most starred / New only.
- **Topic-level** AI summary card: replaced by per-PDF ✨ summaries.
- On-page "Demo data…" and MIT credit lines: removed at the user's request. The attribution is kept in DECISIONS.md and each PDF's footer. **Add a credit (e.g. footer) before any public deploy.**
- **Guinness logo**: not used (trademark). The pint is a generic stout SVG.
- "Did ye" → "Did you". The "test card" hint was removed from the tip pop-up.

## 13. Open items / next steps (priority order)

1. **Stripe Connect key**: new Stripe account → Connect (marketplace) → `sk_test_` key → test held → paid payout as aoife.m.
2. **Condense** (biggest remaining hackathon value): upload slides (PDF/PPTX) → OpenRouter writes notes in the student's style (persona from past notes, reusing `Teaching_Structure/prompt.txt` and `notes.css`) → **2 free, then €3.99/month Stripe subscription**. This is the safest route to the **+5 bonus** ("buy/subscribe to your tool").
3. **Landing headline**: replace "Notes that actually help." Shortlist: "Someone in your module already made the perfect notes." / "Missed a lecture? Someone didn't." / "Reddit for revision."
4. **Sub-headings inside topics?** The user hasn't decided.
5. **Upload AI flags** (agreed earlier): uploads go live, and OpenRouter flags "looks like an assignment answer / off-topic" as a badge. Not built yet.
6. Hackathon evidence: interview 3–5 students (Users first), test one assumption (Stay curious), and prepare the pitch.
7. Later: swap the mock DB for Supabase (see BACKEND_PLAN + DECISIONS swap notes); add a footer credit for the MIT OCW notes.
