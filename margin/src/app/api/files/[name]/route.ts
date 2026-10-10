import { readFile } from "node:fs/promises"
import { getSession } from "@/lib/session"

// Serves uploaded files (PDFs, slide decks, note photos) to signed-in students only.
const TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }
export async function GET(_: Request, ctx: RouteContext<"/api/files/[name]">) {
  if (!(await getSession())?.profile) return new Response("Sign in to view notes.", { status: 401 })
  const { name } = await ctx.params
  const ext = /^[0-9a-f-]{36}\.(pdf|jpg|pptx)$/.exec(name)?.[1]
  if (!ext) return new Response("Not found", { status: 404 }) // no path traversal
  try {
    return new Response(await readFile(`.data/files/${name}`), { headers: { "Content-Type": TYPES[ext] } })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
