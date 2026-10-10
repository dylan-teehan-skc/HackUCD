# MARGIN — Decisions log

Read this first if you are a new agent/dev picking up the project. Newest entries at the bottom.
Product brief: `../BRIEF.md` · UI plan: `../UI_PLAN.md` · Backend plan: `../BACKEND_PLAN.md`.

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
- [ ] Login · Library · Note viewer · Condense
- [ ] Supabase · OpenRouter · Stripe

## Run
`npm run dev` → http://localhost:3000 · `npm run build` must pass before handing off.
