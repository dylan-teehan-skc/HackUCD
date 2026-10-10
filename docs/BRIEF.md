# MARGIN: Website Brief

> Working name: **MARGIN** ("the best notes in the margin"). Change freely.

## What it is
A course-verified notes platform for university students (UCD first).
1. **Library**: students share notes per module/topic. Others star them, and the best rise to the top.
2. **Suggest + approve**: anyone in the module can propose edits; the author approves. Full history.
3. **Condense**: upload lecture slides (PDF/PPTX). AI writes study notes in *your* style, learned from your past notes, in a handwritten notebook look. 2 free, then €3.99/month.

## Who it's for
- **Primary:** UCD undergrads revising for exams who currently hunt for notes in WhatsApp groups, Drive links and Studocu
- **Contributors:** students who took the module last year and have good notes

## Why choose it over Studocu
- Verified per module, so notes come from people actually in the course
- Notes improve over time (suggest + approve), instead of 40 stale copies
- Free to read; you only pay for AI condensing
- Condensed notes match how *you* learn

## Pages (5)
| # | Page | Route | Purpose |
|---|---|---|---|
| 1 | Landing | `/` | Dark, minimal, Anduril-style hero. Explain the product in 3 scrolls, then "Sign in with student email" |
| 2 | Sign in | `/login` | Student email magic link (`@ucdconnect.ie`, `@studentmail.ul.ie`), then pick modules |
| 3 | Modules / Library | `/modules`, `/m/[code]` | Module grid, then topics → subsections → notes ranked by stars |
| 4 | Note viewer | `/n/[id]` | Read a note (PDF or text), star it, suggest an edit, see history |
| 5 | Condense | `/condense` | Upload past notes (builds your persona) + slides, get handwritten-style notes, publish to library. Paywall on the 3rd |

## Visual direction
- Anduril-inspired: near-black, huge condensed uppercase type, lots of empty space, thin 1px rules, small monospace labels, slow fades
- One accent colour used rarely (signal amber `#FFB000`)
- The handwritten notes (red/blue/black/green ink + yellow highlighter on dotted paper) are the *only* warm, colourful thing. They should pop against the dark UI
- Full detail: `UI_PLAN.md`

## Tech (vibecode-friendly)
- **Design:** Google Stitch (prompts in chat), then export to code
- **Frontend:** Next.js + Tailwind + shadcn/ui, built with v0 / Lovable / Cursor / Claude Code
- **Backend:** Supabase (Auth magic link, Postgres + RLS, Storage)
- **AI:** OpenRouter (tagging, review pre-check, change summaries, persona, condensing)
- **Payments:** Stripe Checkout (sandbox), subscription
- **Hosting:** Vercel
- Full detail: `BACKEND_PLAN.md`

## Hackathon requirements this covers
- **OpenRouter:** used meaningfully in 5 places (see backend plan)
- **Stripe bonus:** Checkout subscription → webhook → unlocks condensing (shown in the app)
- **Craft:** error states for wrong file type, scanned PDF, duplicate upload, non-student email, double-star
- **Data:** seeded synthetic modules/users/notes, clearly labelled
