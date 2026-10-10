# MARGIN — Decisions log

Read this first if you are a new agent/dev picking up the project. Newest entries at the bottom.
Product brief: `../../docs/BRIEF.md` · UI plan: `../../docs/UI_PLAN.md` · Backend plan: `../../docs/BACKEND_PLAN.md`.

## Stack (2026-10-10)
- **Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui** (style `radix-nova`, Radix base, neutral). Mirrors `~/MyRepos/FYP/dashboard`.
- shadcn's `cn` comes from the `cn` npm package (`src/lib/utils.ts` re-exports it). Don't replace it.
- **framer-motion** only for scroll fades (`components/landing/reveal.tsx`). No other animation libs.
- Backend (not built yet): **Supabase** (auth OTP, Postgres + RLS, storage), **OpenRouter**, **Stripe Checkout**. API lives in Next route handlers under `src/app/api/*` — no separate server.

## Design
- **Dark only**: `class="dark"` hard-set on `<html>`; `--background` overridden to pure black in `globals.css`.
- Anduril-style: wordmark left, few text links centre, one link right; huge framed media; big uppercase display type; lots of space.
- Fonts: **Archivo** (display, `font-display`, stretched 112%), **Geist** (body), **Geist Mono** (labels via the `label` utility).
- One accent `--star` (amber) reserved for stars. Nothing else gets colour except the handwritten notes images.
- Use shadcn components as-is (rounded corners removed only on the hero CTA). Prefer adding shadcn components/blocks (`npx shadcn@latest add …`) over hand-rolling.
- Hero/section images are **real handwritten notes** (Teaching_Structure CNN notes), blurred + darkened with PIL into `public/media/`. The Condense image is page 1 of `Teaching_Structure/outputs/08-Convolutional-Networks/output.pdf`.

## Structure
```
src/app/page.tsx              landing (composition only)
src/app/<route>/page.tsx      one folder per page: login, modules, m/[code], n/[id], condense
src/app/api/<name>/route.ts   backend handlers (see BACKEND_PLAN.md table)
src/components/ui/            shadcn (generated — don't hand-edit unless needed)
src/components/layout/        nav (rendered in root layout, on every page)
src/components/landing/       landing-only sections
src/components/<page>/        components used by one page
src/lib/site.ts               ROUTES + demo stats — every link uses `routes.*`
src/lib/                      supabase client, openrouter helper, types (when backend lands)
docs/DECISIONS.md             this file
```

## Frontend ↔ backend contract
- **All links go through `routes` in `src/lib/site.ts`.** Route names match BACKEND_PLAN pages: `/login`, `/modules`, `/m/[code]`, `/n/[id]`, `/condense`.
- Landing stats are demo constants in `site.ts`, marked `ponytail:`; swap for a Supabase count query.
- When adding data pages, define row types in `src/lib/types.ts` matching the SQL in `BACKEND_PLAN.md` (profiles, modules, topics, notes, note_versions, suggestions, stars, personas) — field names snake_case, same as the DB, so Supabase results need no mapping.
- Paywall/credits are server-side only (`/api/condense` returns 402 → client opens the Pro dialog).

## Status
- [x] Landing page (`/`) — builds, no horizontal scroll at 390px.
- [x] Login (`/login`) — mocked auth, 4 steps: email → code → college → modules
- [ ] Library · Note viewer · Condense
- [ ] Supabase · OpenRouter · Stripe

## Run
`npm run dev` → http://localhost:3000 · `npm run build` must pass before handing off.

## Auth — mocked for the hackathon (2026-10-10)
- `/login` = one vertical card, 3 steps in `components/login/login-form.tsx`: student email → 6-digit code → pick modules → redirect to `/modules`.
- **Student-only check is server-side** in `src/app/login/actions.ts` via `universityFor()` (`src/lib/student-email.ts`, allowed domains listed there: ucdconnect.ie, studentmail.ul.ie, tcd.ie, mail.dcu.ie, umail.ucc.ie, universityofgalway.ie). Test: `node --test src/lib/student-email.test.ts`.
- Code is a fixed demo code `123456` (`DEMO_CODE` in `lib/demo-data.ts`), shown on screen as "Demo code".
- Session = httpOnly cookie `margin_session` holding `{ email, university, module_codes }` (`src/lib/session.ts`). Use `getSession()` in any server page to gate access.
- Modules come from `lib/demo-data.ts` (synthetic).

### Swapping to real Supabase (no UI changes needed)
1. `npm i @supabase/supabase-js @supabase/ssr`; add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. `sendCode` → `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })` (keep the `universityFor` check before it).
3. `verifyCode` → `supabase.auth.verifyOtp({ email, token: code, type: "email" })`.
4. `saveModules` → upsert rows into `enrollments`.
5. `getSession()` → `supabase.auth.getUser()` + select enrollments. Delete `setSession` and `DEMO_CODE`.
6. Also add the domain check as a Supabase "Before User Created" auth hook, and set custom SMTP (built-in email is rate-limited).
- Vercel is only hosting (`vercel deploy`); nothing auth-specific needed there beyond the env vars.

## Sign-up onboarding + nav (2026-10-10)
- Nav lives in `src/app/layout.tsx` (all pages). Pages leave ~5rem top padding for it.
- After the code step: **college** (UCD's 6 real colleges, `colleges` in `lib/demo-data.ts`) → **modules** filtered to that college, with search. Card widens from `max-w-sm` to `max-w-4xl` for these steps.
- **Only at sign-up**: `verifyCode` redirects straight to `/modules` if this email already has modules saved (`completeSignup` stores `college_id` + `module_codes`). Changing modules later belongs on a settings/profile screen, not login.
- Server re-validates: college must exist, modules must belong to that college.
- DB: `colleges(id, name)` table; `modules.college_id`; `profiles.college_id` (BACKEND_PLAN updated).
- Back navigation: every step after email has a `Back` link (top-left label). Code and college steps go back to email with the address kept for editing; modules goes back to college.

## Log in / Sign up, UCD data, protected routes (2026-10-10)
- `/login` has **Log in | Sign up** tabs (`?mode=signup` preselects). Log in = email → code → back to `?next` (default `/modules`). Sign up = email → code → **subject area → course → modules**.
- Log in with an unknown email → "Sign up instead"; sign up with an existing email → "Log in instead" (checked in `sendCode`).
- **Real UCD data**: `src/lib/ucd.ts` = UCD's 11 subject areas + all ~130 courses from ucd.ie/myucd/courses/a-z-course-list (fetched 2026-10-10). UCD's own term on that site is "courses" grouped by subject area; we use "Subject area" → "Course" → "Modules".
- Modules: synthetic suggestions for a few courses (`courseModules` in `lib/demo-data.ts`); any course can add codes by hand, validated as `^[A-Z]{3,4}\d{5}$` on client and server.
- UCD crest (`public/media/ucd-crest.svg`, white, from ucd.ie) fades in top-right of the card on the code step only, for `@ucdconnect.ie` emails. It is rendered as the card's **last** child: shadcn Card strips top padding when an `<img>` is its first child.
- Mock users table: `.data/users.json` via `src/lib/mock-db.ts` (gitignored). Session cookie = `{ email, university, profile }`; `profile` is null until sign-up finishes.
- **Route protection**: `src/proxy.ts` (Next 16's renamed middleware) sends anyone without a finished profile from `/modules`, `/m/*`, `/n/*`, `/condense` to `/login?next=<path>`. `safeNext()` only allows same-site paths.
- `next.config.ts` has `cacheComponents: true`, so pages must not read `searchParams`/cookies outside `<Suspense>`: the login page reads params client-side with `useSearchParams` inside `<Suspense>`.
- Supabase swap: `findProfile`/`saveProfile` → `profiles` + `enrollments` tables; proxy → `@supabase/ssr` `updateSession` pattern.
- 12th subject-area tile = "Not sure? Search all courses" (all 135 courses). Picking a course from it stores the first real UCD area that contains the course.
- Hero/login background = `public/media/hero-library-v3.jpg`: Unsplash photo by Giammarco Boscaro (`images/giammarco-boscaro-…jpg`), blurred (Gaussian 10) and desaturated with PIL. Filename changed from hero.jpg so the Next image cache picks it up.

## Passwords (2026-10-10)
- **Sign up** = email + password (min 8) → email code → subject area → course → modules. The account (scrypt-hashed password, `src/lib/password.ts`, salted, timing-safe compare) is saved only after the code is verified.
- **Log in** = email + password, one step. Wrong email or password gives one generic message ("Email or password is incorrect.") so it doesn't reveal which accounts exist. A signed-up-but-unfinished account resumes at subject area.
- Users table: `.data/users.json` rows are `{ password_hash, profile }`. Passwords never go in the session cookie.
- Test: `node --test src/lib/password.test.ts`.
- Supabase swap: `startSignup`+`verifySignup` → `auth.signUp({ email, password })` + `auth.verifyOtp({ type: "signup" })`; `logIn` → `auth.signInWithPassword`. Delete `password.ts`.
- UCD crest only shows on the sign-up code step now (log in has no code step).
- Share section shows a 2×2 grid of university logos (UCD, UL, Trinity, DCU), white on black (`components/landing/uni-logos.tsx`, files in `public/media/unis/`). Logos taken from each university site; TCD/DCU PNGs recoloured to white with PIL, UL is its inline header SVG. `Feature` takes an optional `media` node for this.
- Condense section = before → after (`components/landing/condense-visual.tsx`): a generic PowerPoint-style template slide drawn in CSS (no real lecture content) → arrow → notes page `public/media/condense-notes-v3.png` (CNN notes re-rendered from Teaching_Structure output.html: lecturer byline + ink key removed, tighter top spacing, caption hidden, ~50px of blank paper below the figures). No panel background — sits on page black. Stacks vertically on phones.
- Rank section = a mini ranked-notes list in UI form (`components/landing/rank-visual.tsx`, synthetic rows): module header, Best/New/Most starred tabs, numbered rows with star counts, #1 star in amber. Reuse this row style for the real library page. Old blurred `rank.jpg` deleted.

## Library home `/modules` (2026-10-10)
- Where log in / sign up lands. Server page reading the session inside `<Suspense>` (cacheComponents). Header = university · course · subject area, then one big row per module: code, name, note count, total stars, last updated, arrow → `/m/[code]`.
- Demo notes in `src/lib/demo-notes.ts` (`notes`, `moduleName`, `moduleStats`); plain-language titles ("Neural networks, explained step by step"). Hand-typed module codes show "Added by you" / "No notes yet · be the first".
- No `Date.now()` in server components (cacheComponents flags it): dates shown as "updated 9 Oct".
- Nav is session-aware (`components/layout/nav.tsx`, `Account` in `<Suspense>`): shows email + **Log out** (`logOut` action → `clearSession()` → home) when signed in, else **Log in**.

## Library structure, notes, filters (2026-10-10, replaces the earlier "mock slides" entry)
- **No lecture slides anywhere.** Only notes. Files in `public/notes/<CODE>/` are real open lecture *notes* from MIT OpenCourseWare (CC BY-NC-SA 4.0: 6.867 ML F06, 6.824 DS S06, 6.006 Algorithms S20), shown with author "MIT OCW". The on-page credit line was removed at the user's request; attribution lives here and inside each PDF. Everything else (other notes, stars, views, lecturers) is fictional.
- `/modules`: compact rows (code, name, note count, stars, updated). No trimester/lecturer line.
- `/m/[code]`: module name + a **grid of topic cards** (note count, top note). Each card → `/m/[code]/[topic]`.
- `/m/[code]/[topic]`: full-width ranked list, **5 per page** (`?page=`), **sort tabs** Best (Wilson) / New / Most starred, and two independent **dropdown filters: Lecturer and Year** (`?lecturer=<slug>&year=2026/27`) in `components/library/filter-bar.tsx` (shadcn Select, URL is the state, any change resets to page 1, "Clear" removes both). Rows (`components/library/note-row.tsx`) show author · lecturer, year · type · pages, a download icon if there's a file, and stars.
- Why lecturer/year: from a student's point of view notes are most useful from the lecturer/year that matches theirs (content and exams change).
- Data: `moduleMeta[code].lecturers` (first = current), `YEARS` (2026/27 newest). Each note has `lecturer` + `year`, spread independently.
- Signed-in users: `/login` redirects to `/modules` (proxy), and the landing CTA becomes "Go to your modules".

## All notes are real PDFs (2026-10-10)
- Every library note is a real open lecture-notes PDF from MIT OpenCourseWare (CC BY-NC-SA 4.0) in `public/notes/<CODE>/` (~10 MB, 49 files): 6.867 ML F06 lectures + 2002–2004 exam solutions, 6.034 AI S05 neural-nets chapter, 6.824 DS S06, 6.006 Algorithms S20. No synthetic note text remains.
- Uploader handles, stars, views, lecturers and years are fictional (assigned in `demo-notes.ts`).
- Non-CS demo modules (FIN/ACC/LAW/ECON/COMP10010) have no notes; they show "No notes yet".
- On-page "Demo data…" line on `/modules` removed at the user's request. Attribution lives here + each PDF's footer — add a credit back (e.g. footer) before any public deploy.

## Upload, suggest edits, author review (2026-10-10)
- `/modules` module rows are **charcoal cards** (`bg-charcoal` #161618, hover #1e1e21 — tokens in `globals.css`).
- **Upload**: "Upload notes" button (shadcn Dialog, `components/library/upload-dialog.tsx`) on the module page and each topic page — only shown for modules you take. Fields: title, topic, lecturer, year, PDF. Server checks: enrolled in module, title 3–120, topic/lecturer/year valid, file starts with `%PDF-`, ≤ 20 MB (`next.config.ts` raises the Server Action body limit to 21 MB). Redirects to the new note.
- **Note page `/n/[id]`**: PDF viewer (native `<iframe>`), stars, download, version, and a side panel:
  - not the author → **Suggest an edit** (what should change, optional page, optional fixed PDF). You can't suggest on your own note.
  - author → **Suggestions to review** with Approve / Reject. Approve = new version (uses the fixed PDF if attached). History is append-only.
  - **History** timeline for everyone (v1 Uploaded → vN, who, when, summary).
- Store: `src/lib/library.ts` → `.data/library.json` + PDFs in `.data/files/` (gitignored), served by `GET /api/files/[name]` to signed-in students only (401 otherwise; filename must be a UUID — no path traversal). `allNotes()` = seed + uploads with latest version applied; pages read from it.
- Seed notes have fake owners (`<handle>@ucdconnect.ie`), so suggestions on them stay pending. To demo review: log in as two students (e.g. demo.student / second.student, both `(local test password)`), A uploads, B suggests, A approves.
- Supabase swap: `notes`, `note_versions`, `suggestions` tables + Storage bucket with signed URLs; RLS as in BACKEND_PLAN.

## Real titles, grey cards, topics, lecturers, AI summary (2026-10-10)
- Note titles are the PDFs' real lecture titles ("Lecture 3: The Support Vector Machine", "Mid-term exam, October 2004 (solutions)"). Several earlier ML titles didn't match their PDF; files re-mapped to the right topics (`boosting.pdf` → `feature-selection.pdf`; "Ensembles" topic dropped). The landing Rank preview keeps its plain-language example titles.
- Charcoal is `#1f1f22` (hover `#2a2a2e`): module cards, topic cards and note rows are separate grey cards with small gaps.
- **New topic**: button on the module page (`components/library/new-topic-dialog.tsx` → `createTopic`), 2–60 chars, no duplicates (case-insensitive), visible to everyone in the module. `moduleTopics()` / `moduleLecturers()` in `library.ts` merge seed + student-added (+ topics notes mention).
- **Add a lecturer**: "+ Add a lecturer…" option in the upload form shows a name field; saved per module so it appears in the Lecturer filter.
- **AI topic summary (OpenRouter)** on every topic page (`components/library/topic-summary.tsx`): "Generate summary" → reads text from each PDF in the topic with `unpdf` (6k chars/PDF, 45k total cap) → `chatJson()` in `src/lib/openrouter.ts` (plain fetch, JSON mode, one retry, clear errors for missing key / 401 / 402) → collapsible card: overview, key points, what to read (titles validated against real notes — invented ones dropped), exam tips, plus a limitations line. Cached in `.data/summaries.json` per topic; shows "notes changed since" when note versions change; "Regenerate" button.
- Env: `.env.local` → `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL` (default `google/gemini-2.5-flash`).
- AI model: free OpenRouter models. Primary `nvidia/nemotron-3-super-120b-a12b:free`, fallbacks via OpenRouter's `models` array (max 3): `dots-studio/dots-3-note-preview:free`, `google/gemma-4-31b-it:free`. Free models get rate-limited (429) → friendly "busy, try again" error. Verified end to end: Neural networks summary (4 PDFs) in ~14 s.
- Gotcha: the pasted key once arrived as `Sk-or-…` (auto-capitalised) → 401. Keys must start with lowercase `sk-or-v1-`.
- **Changed: AI summary is per PDF, not per topic** (topic card and `topic-summary.tsx` removed). Each note row has a ✨ button next to Download: first click → `generateNoteSummary(noteId)` reads that PDF (`unpdf`, first 30k chars) → OpenRouter → panel expands under the row with: 2-sentence overview, "covers" bullets, "good for" line, model + limitation line. Sparkle turns amber once a summary exists; later clicks just expand/collapse. Cached in `.data/summaries.json` keyed `note:<id>@<version>`, so an approved edit (new version) gets a fresh summary. `NoteRow` is now a client component.

## Favourites, sorting, 404s (2026-10-10)
- **Star = favourite.** `StarButton` (`components/library/star-button.tsx`, optimistic, rolls back on error) on every note row and the note page. Stored per student in `library.json` → `stars: { email: noteId[] }`; a note's count = seed stars + real student stars. Only students in the module can star.
- **`/favourites`** (nav link, protected): your starred notes grouped by module, same note rows (unstar to remove), empty state links to your modules.
- **"Best" sort removed** at the user's request. Sort tabs: **Most starred** (default) / New. Topic cards' "Top" = most stars. Wilson score code (`lib/rank.ts` + test) deleted.
- `/condense` placeholder page (was a 404) until the Condense flow is built; styled `app/not-found.tsx` for any bad link.

## Tip the author (Stripe Checkout, sandbox) (2026-10-10)
- Note page: "☕ Buy <author> a coffee" button (hidden on your own notes) → pop-up **"Did you find these notes helpful?"** with three options: ☕ coffee €3, pint €7 (generic stout SVG — no Guinness logo, it's a trademark), 🐹 hamster €15 (`components/library/tip-dialog.tsx`, amounts in `src/lib/tips.ts`).
- "Send …" → `startTip()` creates a Stripe Checkout Session (`mode: payment`, inline EUR price, metadata note/item/from) → redirect to Stripe's hosted page → back to `/n/<id>?tip_session=cs_…`.
- On return the server **retrieves the session from Stripe** and only records it if `payment_status === "paid"` and it's for this note; stored once per session id in `library.json → tips`. Shows a thank-you banner; the author sees "N students have thanked you · €X in tips"; the button shows the supporter count.
- `src/lib/stripe.ts` refuses live keys (must be `sk_test_…`). No key → clear message in the pop-up. `.env.local` has an empty `STRIPE_SECRET_KEY=` slot.
- Webhooks skipped (success-page verification is enough for the demo); add `checkout.session.completed` webhook if tips must be recorded when users close the tab before returning.
- Tip jar moved from the header to a visible charcoal card at the bottom of the note sidebar, under History: ☕ + "Did you find these notes helpful?" + supporter line + full-width "Buy <author> a coffee" button that opens the pop-up.
- Tip card is now a big outer card with an inner box ("Buy <author> a…") holding three small tiles (☕ €3 / pint €7 / 🐹 €15). Clicking a tile opens the pop-up with that option preselected.
- Tip entry point simplified (user feedback): no outer card, no logos in the sidebar. Under History: small label "Did you find these notes helpful?" + one grey box-button "Leave a tip to say thanks / Be the first to thank <author>". Logos + prices only in the pop-up. "Did ye" → "Did you". Test-card hint removed from the pop-up (still documented here: Stripe test card 4242 4242 4242 4242).
- **Stripe sandbox** created with the Stripe CLI (`stripe sandbox create`), account `acct_…`, **expires 2026-10-17 unless claimed**. Keys live only in `.env.local` (`STRIPE_SECRET_KEY` is a sandbox `rkcs_test_` key; `lib/stripe.ts` accepts sk/rk/rkcs `_test_` and refuses live). Claiming failed because the owner's Stripe account isn't activated; not needed for the hackathon.
- **Webhook** `POST /api/stripe/webhook` (signature-verified with `STRIPE_WEBHOOK_SECRET`) records tips on `checkout.session.completed` / `async_payment_succeeded` when `payment_status === "paid"`. Locally run `stripe listen --forward-to localhost:3000/api/stripe/webhook` (its whsec_ is in `.env.local`). Success-page check stays for instant UI; both are idempotent by session id.
- Verified: "Send a pint" creates a real Checkout Session and redirects to checkout.stripe.com. Headless auto-filling Stripe's card form didn't complete, so pay once by hand with 4242 4242 4242 4242 to see the thank-you + webhook.

## Stripe Connect payouts to authors (2026-10-10)
- Model: **separate charges & transfers**. Platform charges the tip (Checkout), records it (webhook + success page, idempotent) with its charge id, then transfers **90%** to the author's connected account with `source_transaction` + idempotency key `tip-transfer-<session>` (Margin keeps 10%). If the author hasn't set up payouts, the tip is **held** and released when they finish (`releaseHeldTips`, `src/lib/payouts.ts`).
- Authors: **`/me` "Your tips"** (nav link): paid vs waiting totals, list of tips (Held/Paid), **Set up payouts / Finish setup** → `setupPayouts()` creates an **Accounts v2** recipient account (`configuration.recipient.stripe_balance.stripe_transfers`, express dashboard, IE, EUR, fees/losses collector = application) once, then a v2 account link → Stripe-hosted onboarding → back to `/me?connected=1` which checks `stripe_transfers.status === "active"` and releases held tips.
- Works per logged-in student (author = note `owner` email). Seed notes are owned by `<handle>@ucdconnect.ie`, so signing up as e.g. `aoife.m@ucdconnect.ie` makes you that author.
- **Blocker**: the CLI sandbox key is restricted and lacks Connect permission (`v2_account_storer_write`). Needs a full test secret key (`sk_test_…`) from a Stripe account with Connect enabled in test mode. The page shows a clear message until then.
- SDK note: stripe-node 23's `accountLinks` type has no `configurations` field, so it's omitted.

## Stripe Connect on a full test account (2026-10-10)
- Swapped the restricted `rkcs_test_` key (no Connect permission) for a full `sk_test_` key on the same claimed sandbox "Margin sandbox" (`acct_…`), with Connect enabled ("You collect payments and pay recipients"). Webhook secret regenerated; `stripe listen` now needs `--events checkout.session.completed,checkout.session.async_payment_succeeded`.
- Irish (EU) v2 accounts must request `merchant.card_payments` alongside `recipient.stripe_balance.stripe_transfers`, otherwise Stripe rejects the create. Added both in `setupPayouts`.
- Cleared the one tip from the old sandbox (no charge id, can't transfer). Backup: `.data/library.backup.json`.
- Landing headline is now "Margin" with "Where students share what they know." underneath.
- Verified: hi@ucdconnect.ie → `acct_…` finished test onboarding; card payments, payouts and transfers are all Active. Dashboard: (Stripe dashboard, test mode)

## Condense built (2026-10-10)
- `/condense` has three tabs (state in `?tab=`): **Your notes** (style samples → AI "Your style" traits), **Upload** (PDF/PPTX → notes), **Outputs** (your slides on the left, notes on the right).
- Text: `unpdf` for PDFs, `jszip` reads `<a:t>` from `ppt/slides/slideN.xml` for PPTX (only new dependency). Max 60 slides / 40k chars.
- Output is structured JSON (def/point/question/rule/aside + `==highlight==`) rendered by `components/condense/paper-notes.tsx` in the ink system from `Teaching_Structure/prompt.txt` (Kalam font, dot-grid paper).
- Photos of handwritten notes (JPEG/PNG/HEIC; HEIC/PNG → JPEG via macOS `sips`, ponytail) are transcribed by a free OpenRouter vision model (`VISION` in `openrouter.ts`) with ink colours kept, then used for style traits. Photos are kept and viewable.
- Examples: 5 real lecture decks + the notes Teaching_Structure produced from them live in `public/examples/` and show for everyone, labelled "Example". They were made with prompt.txt by Claude, not by the in-app free model. Say so if asked. The decks are course material: local demo only.
- Store: `.data/condense.json` (outputs, samples, styles). Uploaded decks/photos go in `.data/files`, served signed-in only.
- Not built yet: credits + €3.99/month subscription (+5 Stripe bonus), Publish to library, Download PDF.
