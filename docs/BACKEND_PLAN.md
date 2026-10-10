# MARGIN: Backend Plan (vibecode-ready)

## Stack
- **Next.js (App Router) on Vercel**: pages + route handlers (`app/api/*`). One codebase, no separate server
- **Supabase**: Auth (magic link / OTP), Postgres + Row Level Security, Storage
- **OpenRouter**: all AI calls, via the OpenAI-compatible endpoint `https://openrouter.ai/api/v1/chat/completions`
- **Stripe**: Checkout Sessions (subscription), webhook
- Tools: Google Stitch (design), v0 or Lovable (Stitch → React), Cursor / Claude Code (wiring), Supabase CLI (migrations), Stripe CLI (local webhooks)

## Env vars
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
OPENROUTER_API_KEY=
OPENROUTER_MODEL_FAST=google/gemini-2.5-flash      # tagging, checks, vision persona
OPENROUTER_MODEL_WRITE=anthropic/claude-sonnet-4.5  # condensing (swap to any strong model)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...         # €3.99/month, created in the sandbox
ALLOWED_EMAIL_DOMAINS=ucdconnect.ie,studentmail.ul.ie
FREE_CONDENSES=2
```

## Auth
- `supabase.auth.signInWithOtp({ email })`, using a 6-digit code (more reliable at a hackathon than clicking a link)
- Enforce the domain **twice**:
  1. client-side message
  2. Supabase **Before User Created** auth hook (or a Postgres trigger on `auth.users`) that rejects any domain not in the allowed list
- ⚠️ Supabase's built-in email is heavily rate-limited (a few emails per hour). Before the demo, set up custom SMTP (Resend, free tier) in Auth settings, or seed test users

## Database (Postgres)
```sql
profiles        (id uuid pk = auth.users.id, email, display_name, is_reviewer bool default false, condenses_used int default 0, is_pro bool default false, stripe_customer_id text, college_id references colleges)
colleges        (id text pk, name)                                -- UCD's 6 colleges
modules         (id, code text unique, name, school, college_id references colleges)
enrollments     (user_id, module_id, pk(user_id, module_id))
topics          (id, module_id, title, parent_id null)          -- parent_id null = topic, set = subsection
notes           (id, topic_id, author_id, title, kind text check (kind in ('pdf','markdown','condensed')),
                 visibility text check (visibility in ('public','module','private')),
                 status text check (status in ('draft','in_review','live','rejected')),
                 current_version int, file_path text null, created_at, updated_at)
note_versions   (id, note_id, version int, editor_id, body_md text null, file_path text null,
                 change_summary text, created_at, unique(note_id, version))   -- history log
suggestions     (id, note_id, proposer_id, base_version int, body_md text null, file_path text null,
                 page int null, reason text, precheck jsonb, status text check (status in ('pending','approved','rejected')),
                 reviewer_id null, reviewed_at null)
stars           (user_id, note_id, created_at, pk(user_id, note_id))
note_views      (user_id, note_id, pk)                           -- needed as the "trials" for Wilson
personas        (user_id pk, traits jsonb, evidence jsonb, updated_at)
condense_jobs   (id, user_id, input_path, output_html_path, status, error, created_at)
```

### Ranking (Wilson score lower bound, Reddit "Best")
```sql
create view note_rank as
select n.id,
  count(s.*)  as stars,
  greatest(count(v.*), count(s.*)) as views,
  case when greatest(count(v.*),1)=0 then 0 else
    ((count(s.*)::float/greatest(count(v.*),1)) + 1.9208/greatest(count(v.*),1)
     - 1.96*sqrt(((count(s.*)::float/greatest(count(v.*),1))*(1-(count(s.*)::float/greatest(count(v.*),1))) + 0.9604/greatest(count(v.*),1))/greatest(count(v.*),1)))
    / (1 + 3.8416/greatest(count(v.*),1)) end as score
from notes n left join stars s on s.note_id=n.id left join note_views v on v.note_id=n.id
group by n.id;
```
Positive votes = stars, total = unique viewers. ponytail: computed live in a view; make it a materialised view refreshed on star if it gets slow.

### RLS (row level security) rules
- `notes` select:
  - `visibility='public' and status='live'`
  - OR (`visibility='module'` and the user is enrolled in that topic's module)
  - OR `author_id = auth.uid()`
- `notes` insert: the user is enrolled in the module
- `notes` update: author only
- `suggestions` insert: any user enrolled in the module
- `suggestions` update (approve/reject): note author or `is_reviewer`
- `stars`: insert/delete only own row; enrolled or the note is public
- `note_versions`: insert only via the server route (service role), so the history log can't be forged
- Storage buckets `notes`, `slides`, `condensed`: private, served via signed URLs from server routes

## Route handlers (`app/api/...`)
| Route | Does |
|---|---|
| `POST /api/notes` | Upload: store file → extract text → AI tag suggestion → create note + v1 → status `in_review` (public) or `live` (module/private) |
| `POST /api/notes/[id]/star` | Toggle star (unique pk prevents doubles) |
| `POST /api/notes/[id]/suggest` | Save suggestion → AI pre-check → `pending` |
| `POST /api/suggestions/[id]/review` | approve: new `note_versions` row + AI change summary, bump `current_version`. reject: status only |
| `POST /api/notes/[id]/restore` | Author restores version N as a new version (history is never rewritten) |
| `POST /api/persona` | Past notes (text/images) → persona JSON |
| `POST /api/condense` | Paywall check → slides text → condensed HTML → save to storage |
| `POST /api/checkout` | Create Stripe Checkout Session (`mode: 'subscription'`, `price: STRIPE_PRICE_ID`, `client_reference_id: user.id`, `success_url: /success?session_id={CHECKOUT_SESSION_ID}`) |
| `GET /success` | Retrieve the session; if `status==='complete'`, show `YOU'RE PRO` |
| `POST /api/stripe/webhook` | Verify signature; on `checkout.session.completed` set `profiles.is_pro=true`; on `customer.subscription.deleted` set it false |

### Paywall check (server-side, never client)
```ts
if (!profile.is_pro && profile.condenses_used >= FREE_CONDENSES) return 402 → client opens the Pro modal
// after a successful condense:
update profiles set condenses_used = condenses_used + 1
```

## OpenRouter usage (the "AI usage" criterion)
One helper, `lib/openrouter.ts`: `chat({ model, messages, json? })`, a fetch to OpenRouter with headers `Authorization: Bearer`, `HTTP-Referer`, `X-Title: MARGIN`. If JSON mode is on, parse the reply and retry once on invalid JSON, then return a friendly error.

| # | Feature | Model | Input → Output |
|---|---|---|---|
| 1 | Topic tagging | FAST | note text (first 3k chars) + module topic list → `{topic_id, confidence, reason}` |
| 2 | Review pre-check | FAST | note/suggestion text + module name → `{on_topic, looks_like_assignment, duplicate_of, notes}` (duplicates: also compare against the top 5 notes in that subsection) |
| 3 | Change summary | FAST | old vs new text → one line, under 15 words |
| 4 | Persona | FAST (vision) | past note images/text → `{traits[{name, description, evidence_quote}], tone, structure, colour_use}` |
| 5 | Condense | WRITE | `Teaching_Structure/prompt.txt` with `<about_me>/<how_i_learn>` replaced by the persona + slide text → HTML body; wrapped with `notes.css` |

Show limitations in the UI:
- tag confidence
- "AI pre-check is advisory; a human approves"
- the evidence quotes on the persona
- `[added]` tags in the condensed notes

## File extraction
- PDF: `pdf-parse` (or `unpdf`) in a Node route. Empty text → `422 SCANNED_PDF`
- PPTX: `officeparser` (npm) → text per slide
- Images (past notes): sent straight to the vision model as base64
- Limits: 20MB, 60 slides (truncate and tell the user)

## Seed data (synthetic, labelled)
- 4 UCD-style modules, 3 topics each, 2 subsections each, about 15 notes with varied stars/views (so ranking visibly differs between Best and Most Starred), 3 pending suggestions, 5 versions on one note
- Script: `supabase/seed.sql`

## Build order (afternoon)
1. Supabase project + schema + RLS + seed (45m)
2. Auth OTP + domain check + module picker (45m)
3. Library pages + star + ranking view (1h)
4. Viewer + suggest + review + history (1h15)
5. Condense + persona (1h)
6. Stripe checkout + webhook + Pro badge (45m)
7. Failure-input pass + 5-student test + pitch (45m)

## Verification
- Non-student email → rejected by both the client and the hook
- Star twice → count unchanged; Best order ≠ Most Starred order on seed data
- Suggest an edit as user B → user A approves → v+1 appears in history with an AI summary → restore v1 works
- A module-only note is invisible to a user not enrolled (test with a second account)
- 3rd condense → 402 → Stripe test card `4242 4242 4242 4242` → webhook sets `is_pro` → condense works; the payment is visible in the Stripe sandbox
- Scanned PDF / .docx / 200-slide deck → clear error or truncation message
