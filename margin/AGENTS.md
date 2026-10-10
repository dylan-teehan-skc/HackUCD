# Agents
Read `docs/HOW_IT_WORKS.md` (how everything works), `docs/PROJECT_CONTEXT.md` (full context) then `docs/DECISIONS.md` before changing anything, and append a dated entry for any new decision.
Keep it minimal (ponytail): reuse shadcn components, no new deps without a reason, all links via `routes` in `src/lib/site.ts`. Never print or commit `.env.local`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
