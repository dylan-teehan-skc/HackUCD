# Course Notes Library + Condense (HackUCD 2026)

Theme: Everyday Frustrations → Learning and revision.

## One-liner
Verified students share notes per module. The best notes rise to the top by stars. Slides can be condensed into notes with AI: 2 free, then €3.99/month.

## Build order
1. **Shared notes library** (build first, fully working)
2. **Condense** (Teaching_Structure-style) + Stripe paywall

## Part 1: Shared notes library

### Sign-in
- Magic link to a student email. Allowed domains are configurable: `ucdconnect.ie`, `studentmail.ul.ie` (Dylan's account for testing: `23365498@studentmail.ul.ie`)
- Demo mode: the magic link is shown on screen / printed to the console instead of emailed (no SMTP needed)
- After sign-in, the student picks their modules (self-select). Future work: proof of enrolment

### Structure
- Module (e.g. COMP30760) → Topic → Subsection → Note
- Any verified member of a module can add a topic or subsection

### Notes
- Upload PDF / markdown / text, or write in the browser
- Visibility: `public` · `module` (verified members only) · `private` (draft)

### Editing: suggest + approve
- The author edits directly
- Anyone else in the module proposes an edit (shown as a diff)
- The author or a trusted reviewer approves or rejects it

### Review queue
- New public notes and suggested edits go to a queue
- An OpenRouter pre-check runs first:
  - is it on-topic for the module?
  - does it look like a graded assignment answer?
  - is it a near-duplicate of an existing note?
- Then a human approves

### History
- Every version stored: who, when, what changed
- AI one-line change summary
- Rollback to any version

### Ranking
- Stars (1 per user per note)
- Sorted by Wilson score lower bound (Reddit "Best" style), so 9/10 beats 50/200
- Optional recency boost

### AI (OpenRouter) in Part 1
- Auto-suggest module/topic tags on upload
- Review pre-check
- Change summaries

## Part 2: Condense + paywall
- Upload PDF/PPTX → notes in the Teaching_Structure style (`Teaching_Structure/prompt.txt`, `shared/style/notes.css`)
- 2 free condenses per user; the 3rd requires Stripe Checkout (subscription, €3.99/month, sandbox)
- `/success` verifies the session, then unlocks unlimited
- One click: "Publish to module library" (goes through review)
- Later: the persona idea (`IDEA_PersonaNotes.md`), so condensed notes match your note style

## Brief checklist
- **Users first**: interview 5 students: where do you get notes now (WhatsApp, Drive, Studocu)? What's wrong with it?
- **Competitor**: Studocu. Our difference: verified per module, editable and improvable, AI condense, free reading
- **Stay curious**: does the top-ranked note match what students pick blind? Does AI tagging match student choice?
- **Failure inputs**: wrong file type, scanned PDF with no text, duplicate upload, non-student email, edit to someone else's note, starring twice
- **Data**: synthetic seeded modules/users/notes, clearly labelled
- **Risks**: lecturer slide copyright (publish student notes only, never raw slides); academic integrity (pre-check flags assignment answers)
