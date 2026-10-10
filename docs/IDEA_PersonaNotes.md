# NoteSelf — persona-driven study notes (HackUCD 2026)

## Context
HackUCD brief (`~/MyRepos/HackUCD/hackucd-2026-challenges.pdf`): pick a theme, build one working workflow in an afternoon, use OpenRouter meaningfully, test an assumption, +5 bonus for a real Stripe sandbox purchase that unlocks access.

Dylan's idea: student uploads past notes → we infer *how they learn* → a saved "learning persona" → every future slide deck/PDF is turned into notes in their style. First 2 decks free, 3rd needs a subscription.

**Fit:** Everyday Frustrations → "Learning and revision" is a listed sample direction. Fits cleanly.
**Chance of winning:** good *if* the demo proves the persona matters. Notes/quiz apps will be common, so the differentiator must be visible: the same slides produce clearly different notes for two different personas, and real students preferred their persona version over a generic AI summary. Without that evidence it looks like "ChatGPT summary with a paywall".

Key reuse: `~/MyRepos/HackUCD/Teaching_Structure/prompt.txt` is already a hand-written persona (`<about_me>`, `<how_i_learn>`, `<note_structure>`, `<ink_colour_system>`). The product automates writing that block from someone's notes.

## Approach (Flask, local, one repo folder)
New folder `~/MyRepos/HackUCD/noteself/`:

| File | Does |
|---|---|
| `app.py` | Flask routes: `/` upload page, `POST /persona` (past notes → persona), `POST /notes` (slides → notes, paywall check), `/checkout`, `/success`, `/notes/<id>` view |
| `extract.py` | PDF → text via `pdftotext` subprocess (already installed); PPTX → text via `python-pptx`; images → base64 for a vision model; `.txt/.md` as-is. Clear errors for empty/scanned/unsupported files |
| `llm.py` | One `chat(messages, model)` call to OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) via `urllib` — no SDK. JSON-mode helper with one retry on invalid JSON |
| `prompts.py` | `PERSONA_PROMPT` (notes → JSON persona) and `notes_prompt(persona, slides_text)` built from `Teaching_Structure/prompt.txt`, swapping its `<about_me>/<how_i_learn>/<note_structure>/<ink_colour_system>` for the persona |
| `store.json` | `{user_id: {persona, generations, subscribed}}` — cookie user id. ponytail: JSON file, swap to SQLite if multi-process |
| `templates/` | `index.html`, `persona.html` (show the extracted persona as readable cards — this is the "wow" + trust moment), `notes.html` |
| `eval/` | A/B script + results (see Verification) |

**Persona schema** (mirrors prompt.txt so generation reuses it): `building_ideas`, `examples_and_analogies`, `handling_hard_parts`, `detail_level`, `tone` (with 3 quoted phrases from their notes as evidence), `structure` (bullets/arrows/tables/questions), `colour_system` (pens/highlighter usage), `evidence` (which uploaded snippets drove each trait). Showing evidence = "understanding of limitations" for AI criterion.

**Notes output:** LLM returns body HTML; we wrap it with `Teaching_Structure/shared/style/notes.css` (reuse; recolour via persona colour_system as CSS vars). Skip matplotlib plots/toys — LLM inline SVG only. ponytail: no generated plots, add `shared/plots` pipeline if time remains.

**Paywall + Stripe bonus:**
- `generations < 2` → generate free. Otherwise redirect to Stripe Checkout Session, `mode="subscription"`, €4.99/month price (created once by lookup_key at startup), `success_url=/success?session_id={CHECKOUT_SESSION_ID}`.
- `/success` retrieves the session, requires `status=="complete"` and `payment_status=="paid"`, sets `subscribed=true`, shows "Unlocked" + subscription id. That satisfies "recognise the purchase". Skip webhooks (add if time).
- Pricing rationale for judges: students pay monthly during term; ~cost of one coffee.

**Models (env var, OpenRouter):** a cheap vision-capable model for persona extraction from note photos; a stronger model for note writing. Print token cost per run on the page.

## Deps
`python3 -m venv .venv && .venv/bin/pip install flask stripe python-pptx`. Env: `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY` (sandbox `sk_test_…`).

## Demo data
- Persona A: Dylan's real handwritten notes `Teaching_Structure/inputs/08-Convolutional-Networks/handwritten-notes/` (PNGs + `converted.txt`).
- Persona B: clearly labelled synthetic "exam-cram, bullets only, no analogies" notes.
- Slides: `Teaching_Structure/inputs/07-Regularisation/07-regularisation.pdf` → generate for A and B side by side.

## Afternoon schedule (~5h)
1. Extract + OpenRouter call + persona JSON (1h)
2. Notes generation with notes.css (1h)
3. Upload UI + persona card page (45m)
4. Stripe Checkout + unlock (45m)
5. A/B test with 3–5 students + failure-input tests (45m)
6. Pitch slides: user, problem, workaround, evidence, demo (45m)

## Verification
- Run `.venv/bin/flask --app app run`; upload Persona A notes → persona card shows traits with quoted evidence.
- Upload the same deck as A and as B → visibly different notes (structure, tone, colours).
- 3rd upload → Stripe Checkout; pay with `4242 4242 4242 4242` → `/success` shows Unlocked; 3rd deck generates; payment visible in Stripe sandbox dashboard.
- Boundary/failure inputs: empty PDF, scanned PDF (no text → clear message), 80-slide deck (truncate/chunk + say so), random non-notes image, LLM returns bad JSON (retry then friendly error), missing API key.
- "Stay curious": blind A/B — generic summary vs persona notes for 3–5 classmates; record preference + one quote each in `eval/results.md`; change one thing based on feedback and say what.
