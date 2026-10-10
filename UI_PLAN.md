# MARGIN: UI Plan (minimal)

Same stack as `~/MyRepos/FYP/dashboard`, so it looks good by default:
- **Next.js + Tailwind v4 + shadcn/ui** (style `new-york`, base colour `zinc`, **dark mode only**)
- **lucide-react** icons, **framer-motion** for slow fades
- **Geist Sans / Geist Mono** (Next default; clean like Anduril)

Setup: `npx create-next-app@latest margin` → `npx shadcn@latest init` (new-york, zinc) → force `class="dark"` on `<html>`.
Copy `src/lib/utils.ts` and the `globals.css` theme from the FYP dashboard.

## Rules
- Black background, white text, one accent (amber) for stars only
- One idea per screen; hide anything not essential
- Use shadcn components as-is; no custom card styles
- The handwritten notes are the only colourful thing (`Teaching_Structure/shared/style/notes.css`)

## Pages → components

| Page | Layout | shadcn components |
|---|---|---|
| **1. Landing** `/` | Nav (wordmark · Library · Condense · Sign in). Full-bleed video/image framed in black. 3 full-screen one-line sections. One CTA. Anduril-style footer | `Button`, `Separator`, `NavigationMenu`; framer-motion fade-in |
| **2. Sign in** `/login` | Centred. Email → 6-digit code → tick modules | shadcn **block `login-04`** (or `login-03`) as base, `Input`, **`InputOTP`**, `Command` (module search), `Checkbox`, `Sonner` (errors) |
| **3. Library** `/modules`, `/m/[code]` | Module list → inside a module: topics on the left, ranked notes on the right | shadcn **block `sidebar-07`** for the topic tree, `Table` or plain rows for notes, `Toggle` (star), `Tabs` (Best / New / Most starred), `Dialog` (upload), `Badge` (only "In review"), `Skeleton` |
| **4. Note** `/n/[id]` | Document fills the screen. Star + title on top. "Suggest edit" and "History" open side panels | `Sheet` (history + suggest), `ScrollArea`, `Textarea`, `Button`; **react-pdf** for PDFs; **react-diff-viewer-continued** for suggestions |
| **5. Condense** `/condense` | One drop zone → (first time) past notes → result page on black | `Card` (drop zone), `Progress`, `Skeleton`, `Dialog` (Pro upgrade: "Unlimited · €3.99/month · Subscribe"), `Sonner` |

Footer (landing only): wordmark top-left; 3 columns (Product · Students · Social) with small grey headings and white links; bottom-left copyright + Privacy / Terms / Academic Integrity / Content Removal; bottom-right Contact.

## Where OpenRouter is used
| # | Where (page) | Feature | Model tier |
|---|---|---|---|
| 1 | Library → Upload dialog | Suggest the module topic/subsection for a new note | fast |
| 2 | Library / Note → review | Pre-check before a human approves: on-topic? looks like an assignment answer? duplicate? | fast |
| 3 | Note → History | One-line summary of what changed between versions | fast |
| 4 | Condense → first run | Read past notes (photos/PDF) → learning persona with quoted evidence | fast, vision |
| 5 | Condense → result | Write the notes from the slides in the persona's style (Teaching_Structure prompt) | strong |

All five go through one helper, `lib/openrouter.ts`. Details: `BACKEND_PLAN.md`.
