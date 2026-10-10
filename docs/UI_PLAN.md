# MARGIN: UI Plan

## Design system

### Colour tokens
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0A0A0A` | page |
| `surface` | `#111111` | cards, panels |
| `line` | `#262626` | 1px borders, dividers |
| `text` | `#F2F2F2` | primary text |
| `muted` | `#8A8A8A` | secondary text, labels |
| `accent` | `#FFB000` | stars, primary CTA hover, focus ring. Use sparingly |
| `danger` | `#E5484D` | errors, rejected |
| `ok` | `#3FB950` | approved |

Ink colours, used **only** inside handwritten notes (from `Teaching_Structure/shared/style/notes.css`):
- red `#b3262e` · blue `#1f2f8f` · black `#16161a` · green `#2d7a55`
- highlighter `#fff27a`
- paper `#fbfaf6`, with a dot grid

### Type
- Display: **Inter Tight** 700–800, UPPERCASE, tight tracking (−0.02em), 64–140px on the hero
- Body: **Inter** 400, 16px
- Labels / meta: **JetBrains Mono** 12px, UPPERCASE, +0.08em tracking, `muted` colour (e.g. `COMP30760 / 12 NOTES / UPDATED 2D AGO`)
- Notes: **Caveat** (headers) + **Kalam** (body), on paper only

### Components
- Buttons:
  - primary: white fill, black text, square corners
  - secondary: 1px `line` border, transparent
  - text links: underline on hover
- Cards: `surface`, 1px `line`, no radius (or 2px), no shadow. Hover lifts the border to `#3a3a3a`
- Star control: outline star → filled `accent`, with a count in mono
- Tags: mono, 1px border, uppercase
- Motion: 200–400ms fades and slight upward reveals on scroll. No bouncy animation
- Layout: 12-column grid, max 1280px, 16px gutter on mobile, sticky thin top nav

### Top nav (all pages except landing hero)
- Left: `MARGIN` wordmark
- Centre: `LIBRARY · CONDENSE`
- Right: credits badge (`2 FREE LEFT` or `PRO`), avatar

## Page 1: Landing `/`
1. **Hero** (100vh):
   - full-bleed dark background with a slow-moving macro shot of handwritten notes, darkened to about 20%
   - headline `NOTES THAT ACTUALLY HELP.`, with a mono sub-label `BUILT BY STUDENTS · VERIFIED BY COURSE · RANKED BY STARS`
   - CTA `SIGN IN WITH STUDENT EMAIL →`
2. **Stats strip**: 3 mono numbers, e.g. `1,240 NOTES / 86 MODULES / 9.1K STARS` (label as demo data)
3. **Three sections**, each with a full-width image left and text right, alternating:
   - `SHARE`: upload notes to your module
   - `RANK`: the best notes rise
   - `CONDENSE`: slides become notes in your handwriting style. Show a handwritten notes page tilted on black
4. **How review works**: a horizontal line diagram: Upload → AI check → Peer review → Live → Suggested edits
5. **Footer**: minimal mono links, plus a note: `NOT AFFILIATED WITH UCD`

## Page 2: Sign in `/login`
- Split screen:
  - **left:** big uppercase `SIGN IN`, and mono text `STUDENT EMAIL ONLY`
  - **right:** form
- Email input with inline domain validation (allowed: `ucdconnect.ie`, `studentmail.ul.ie`). Wrong domain shows: `USE YOUR STUDENT EMAIL`
- Submit button `SEND MAGIC LINK`
- State 2: `CHECK YOUR INBOX`, with a resend timer. In demo mode, also show the link or a 6-digit code
- State 3 (first login), **module picker**:
  - search a module code or name
  - checkbox list
  - `CONTINUE`

## Page 3: Modules / Library `/modules` and `/m/[code]`
- `/modules`:
  - grid of module cards: code (mono), name (uppercase), note count, top contributor
  - filter: `MY MODULES / ALL`, plus search
- `/m/[code]`:
  - **Left rail:** topic tree (Topic → Subsection), with `+ ADD TOPIC` and `+ ADD SUBSECTION`
  - **Main:** note list for the selected subsection, sorted by `BEST` (Wilson score) / `NEW` / `MOST STARRED`
  - **Note row:** title, author, star button + count, mono meta (`PDF · 12 PAGES · v4 · UPDATED 3D AGO`), badges (`AI-CONDENSED`, `IN REVIEW`)
  - Top-right: `UPLOAD NOTE`, which opens a drawer: file or write, visibility (`PUBLIC / MODULE / PRIVATE`), AI-suggested topic tags shown as chips to accept
- Empty states: `NO NOTES YET. BE THE FIRST.`

## Page 4: Note viewer `/n/[id]`
- **Centre:** viewer
  - PDF via PDF.js, page thumbnails down the left
  - markdown/handwritten notes rendered on paper
- **Right panel**, with tabs:
  - `DETAILS`: author, version, stars, visibility
  - `SUGGEST`: for markdown notes, edit mode with a side-by-side diff. For PDFs, a page-anchored comment or an uploaded replacement file. Plus a "reason" field
  - `HISTORY`: timeline of versions, each with author, time and an AI one-line summary. `VIEW` and `RESTORE` (author only)
  - `REVIEW`: author/reviewer only. Pending suggestions with the AI pre-check result (`ON TOPIC ✓ · NOT ASSIGNMENT ✓ · DUPLICATE ✗`) and `APPROVE` / `REJECT`
- Star button large at the top. Starring twice toggles it off

## Page 5: Condense `/condense`
- **Step 1, Your style:**
  - upload 1–5 past notes (photos, PDF, text)
  - the AI builds a **persona card**: traits like "Intuition before formulas", "Uses arrows for consequences", "Casual tone", each with a quoted snippet from your notes as evidence
  - editable, and saved for next time
- **Step 2, Slides:** drag in a PDF/PPTX. Shows page count and an estimated time
- **Step 3, Result:**
  - the handwritten notes page (paper look, ink colours) next to the original slide thumbnails
  - buttons: `DOWNLOAD PDF`, `PUBLISH TO LIBRARY` (picks module/topic, then goes to review)
- **Credits:** `2 FREE CONDENSES LEFT`. On the 3rd, a modal:
  - `GO PRO · €3.99/MONTH · UNLIMITED CONDENSES`
  - `SUBSCRIBE`, which goes to Stripe Checkout
  - after paying, a `/success` screen: `YOU'RE PRO`, showing the subscription id
- Errors:
  - `THIS PDF HAS NO READABLE TEXT (SCANNED?)`
  - `PPTX/PDF ONLY`
  - `DECK TOO LONG: FIRST 60 SLIDES USED`

## Responsive
- Phone: the nav collapses to a menu; the topic tree becomes a top dropdown; the viewer's right panel becomes a bottom sheet
- No sideways scroll anywhere
