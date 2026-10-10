import { mkdir, readFile, writeFile } from "node:fs/promises"
import { extractText, getDocumentProxy } from "unpdf"
import type { DemoNote } from "./demo-notes"
import { chatJson, MODEL } from "./openrouter"

// What one PDF covers, shown under its row. Cached per note version.
export type NoteSummary = { overview: string; covers: string[]; good_for: string; model: string; generated: string }

const FILE = ".data/summaries.json"
const MAX_CHARS = 30000 // ponytail: first ~30k chars of the PDF; chunk + combine if long notes matter
export const summaryKey = (n: DemoNote) => `note:${n.id}@${n.version ?? 1}`

async function all(): Promise<Record<string, NoteSummary>> {
  try { return JSON.parse(await readFile(FILE, "utf8")) } catch { return {} }
}
export async function cachedSummaries(notes: DemoNote[]) {
  const store = await all()
  return Object.fromEntries(notes.map((n) => [n.id, store[summaryKey(n)] ?? null]))
}

// Seed PDFs live in public/, uploads in .data/files (served via /api/files).
const diskPath = (url: string) => (url.startsWith("/api/files/") ? `.data/files/${url.slice(11)}` : `public${url}`)

export async function summariseNote(note: DemoNote, moduleName: string): Promise<NoteSummary> {
  if (!note.file) throw new Error("This note has no PDF to read.")
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(diskPath(note.file))))
  const text = (await extractText(pdf, { mergePages: true })).text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS)
  if (text.length < 200) throw new Error("Couldn't read text from this PDF (it may be a scanned image).")

  const out = await chatJson<Partial<NoteSummary>>([
    {
      role: "system",
      content: `You tell a ${moduleName} student what one set of lecture notes covers, so they can decide whether to open it.
Use ONLY the text given; don't invent topics. Plain, friendly English, short sentences.
Reply with JSON: {"overview": string (2 sentences), "covers": string[] (3-6 short items, the main ideas in order),
"good_for": string (one sentence: who/when this is most useful, e.g. "first pass before the lab" or "exam revision")}.`,
    },
    { role: "user", content: `Title: ${note.title}\n\n${text}` },
  ])
  const summary: NoteSummary = {
    overview: String(out.overview ?? ""),
    covers: (out.covers ?? []).map(String).slice(0, 6),
    good_for: String(out.good_for ?? ""),
    model: MODEL,
    generated: new Date().toISOString().slice(0, 10),
  }
  if (!summary.overview || !summary.covers.length) throw new Error("The AI reply was empty. Try again.")
  const store = await all()
  store[summaryKey(note)] = summary
  await mkdir(".data", { recursive: true })
  await writeFile(FILE, JSON.stringify(store, null, 2))
  return summary
}
