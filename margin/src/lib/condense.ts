import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { promisify } from "node:util"
import JSZip from "jszip"
import { extractText, getDocumentProxy } from "unpdf"
import { chatJson, MODEL, VISION } from "./openrouter"

// ponytail: JSON-file store like library.ts. Swap for a Supabase `condense_outputs` table later.
// Ink system from Teaching_Structure/prompt.txt: red = headers/terms, blue = body, black = rules, green = asides, ==x== = highlighter.
export type Item =
  | { type: "def"; term: string; text: string }
  | { type: "point"; text: string; sub?: string[] }
  | { type: "question"; q: string; a: string }
  | { type: "rule"; text: string }
  | { type: "aside"; text: string }
export type CondensedNotes = { title: string; sections: { heading: string; items: Item[] }[]; remember: string[]; check: string[] }
export type Output = { id: string; owner: string; title: string; module_code: string; source: string; slides: number; length: Length; notes: CondensedNotes; model: string; date: string; styled?: boolean; deck?: string; slide_texts?: string[]; html?: string }
export type Length = "short" | "standard" | "detailed"
export type Sample = { id: string; owner: string; name: string; chars: number; excerpt: string; date: string; image?: string; status?: "reading" | "failed" }
export type Trait = { trait: string; evidence: string }

type Store = { outputs: Output[]; samples?: Sample[]; styles?: Record<string, Trait[]> }
const FILE = ".data/condense.json"
export const MAX_DECK = 20 * 1024 * 1024
const MAX_SLIDES = 60, MAX_CHARS = 40000
export const MAX_SAMPLES = 8

async function load(): Promise<Store> {
  try { return JSON.parse(await readFile(FILE, "utf8")) } catch { return { outputs: [] } }
}
async function save(s: Store) {
  await mkdir(".data", { recursive: true })
  await writeFile(FILE, JSON.stringify(s, null, 2))
}

// Real slide decks + the notes Teaching_Structure/prompt.txt produced from them (public/examples). Shown to everyone.
// Course material: kept out of git (.gitignore). Missing locally → no examples shown.
const EXAMPLES = [
  ["10-transformers", "10 · Transformers"], ["08-convolutional-networks", "08 · Convolutional Networks"],
  ["07-regularisation", "07 · Regularisation"], ["06-measuring-performance", "06 · Measuring Performance"],
  ["05-gradients-and-initialisation", "05 · Gradients & Initialisation"],
]
const examples: Output[] = EXAMPLES.filter(([slug]) => existsSync(`public/examples/${slug}/notes.html`)).map(([slug, title]) => ({  // local-only files, gitignored
  id: `ex-${slug}`, owner: "", title, module_code: "COMP30760", source: `${slug}.pdf`, slides: 0, length: "detailed", styled: true,
  notes: { title, sections: [], remember: [], check: [] }, model: "example", date: "2026-10-08",
  deck: `/examples/${slug}/slides.pdf`, html: `/examples/${slug}/notes.html`,
}))

export const outputsFor = async (owner: string) => [...(await load()).outputs.filter((o) => o.owner === owner).reverse(), ...examples]

export async function deleteOutput(owner: string, id: string) {
  const s = await load()
  s.outputs = s.outputs.filter((o) => !(o.id === id && o.owner === owner)) // examples aren't in the store, so they can't be deleted
  await save(s)
}

// Uploads live in .data/files and are served (signed-in only) by /api/files/[name].
async function saveFile(bytes: Uint8Array, ext: "pdf" | "pptx" | "jpg") {
  const name = `${randomUUID()}.${ext}`
  await mkdir(".data/files", { recursive: true })
  await writeFile(`.data/files/${name}`, bytes)
  return `/api/files/${name}`
}

const isJpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
const isImage = (b: Uint8Array) => isJpeg(b) || (b[0] === 0x89 && b[1] === 0x50) || /^ftyp(heic|heix|mif1|hevc)/.test(Buffer.from(b.subarray(4, 12)).toString("latin1"))

// ponytail: HEIC/PNG → JPEG via macOS `sips` (the demo runs on a Mac). Use sharp+libheif on a server.
async function toJpeg(bytes: Uint8Array) {
  if (isJpeg(bytes)) return bytes
  const src = `${tmpdir()}/${randomUUID()}`, out = `${src}.jpg`
  await writeFile(src, bytes)
  try {
    await promisify(execFile)("sips", ["-s", "format", "jpeg", "-Z", "1024", src, "--out", out])
    return new Uint8Array(await readFile(out))
  } catch { throw new Error("Couldn't read that photo. Export it as JPG and try again.") }
  finally { await rm(src, { force: true }); await rm(out, { force: true }) }
}

// Handwriting → text, keeping ink colours, so the style prompt sees how you actually write.
async function transcribe(jpeg: Uint8Array) {
  const out = await chatJson<{ text: string }>([
    { role: "system", content: `Transcribe this photo of a student's handwritten notes exactly as written (keep their arrows like "->", abbreviations and spelling).
Keep the line structure. Prefix each line with its ink colour in brackets, e.g. "[red] Back Propagation" or "[blue] -> reuses calculations".
Ignore anything outside the main page. Reply with JSON: {"text": string}.` },
    { role: "user", content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${Buffer.from(jpeg).toString("base64")}` } }] },
  ], VISION, 150_000)
  const text = String(out.text ?? "").trim()
  if (text.length < 20) throw new Error("Couldn't read the handwriting in that photo. Try a clearer, closer shot.")
  return text
}

export async function samplesFor(owner: string) {
  const s = await load()
  return { samples: (s.samples ?? []).filter((x) => x.owner === owner), traits: s.styles?.[owner] ?? [] }
}

// Your own past notes: photos of handwritten pages (kept, so you can show them), or PDF/PPTX/TXT (text excerpt only).
// Step 1 (fast, in the request): save every file. Photos are stored as "reading"; text files are read straight away.
export async function addSamples(owner: string, files: File[]) {
  const s = await load()
  const room = MAX_SAMPLES - (s.samples ?? []).filter((x) => x.owner === owner).length
  if (files.length > room) throw new Error(room ? `You can add ${room} more (max ${MAX_SAMPLES}). Remove some first.` : `You already have ${MAX_SAMPLES}. Remove one first.`)
  const date = new Date().toISOString().slice(0, 10)
  const added = await Promise.all(files.map(async (file): Promise<Sample> => {
    if (file.size > MAX_DECK) throw new Error(`${file.name} is over 20 MB.`)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const base = { id: randomUUID().slice(0, 8), owner, name: file.name, date }
    if (isImage(bytes)) return { ...base, chars: 0, excerpt: "", image: await saveFile(await toJpeg(bytes), "jpg"), status: "reading" }
    const text = /\.txt$/i.test(file.name) && file.size < 1e6 ? (await file.text()).replace(/\s+/g, " ").trim() : (await readDeck(file)).text.replace(/\[Slide \d+\] /g, "")
    return { ...base, chars: text.length, excerpt: text.slice(0, 6000) }
  }))
  const fresh = await load()
  ;(fresh.samples ??= []).push(...added)
  await save(fresh)
}

// Step 2 (background, after the response): read every waiting photo in parallel, then update the style once.
export async function readPendingSamples(owner: string) {
  const waiting = (await load()).samples?.filter((x) => x.owner === owner && x.status === "reading") ?? []
  const read = async (x: Sample) => {
    try { return { id: x.id, text: await transcribe(new Uint8Array(await readFile(`.data/files/${x.image!.slice(11)}`))) } }
    catch (e) { console.error("transcribe failed:", (e as Error).message); return { id: x.id, text: "" } }
  }
  // ponytail: 2 at a time. The free vision model queues extra requests until they time out.
  let s = await load()
  for (let i = 0; i < waiting.length; i += 2) {
    const results = await Promise.all(waiting.slice(i, i + 2).map(read))
    s = await load() // save each pair as it finishes, so cards update one by one
    for (const r of results) {
      const x = s.samples?.find((y) => y.id === r.id)
      if (x) Object.assign(x, r.text ? { status: undefined, excerpt: r.text.slice(0, 6000), chars: r.text.length } : { status: "failed" })
    }
    await save(s)
  }
  if (s.samples?.some((x) => x.owner === owner && x.chars > 0)) await refreshStyle(owner).catch((e) => console.error("style failed:", e.message))
}

// Try a failed photo again.
export async function retrySample(owner: string, id: string) {
  const s = await load()
  const x = s.samples?.find((y) => y.id === id && y.owner === owner && y.status === "failed")
  if (x) { x.status = "reading"; await save(s) }
}

export async function removeSample(owner: string, id: string) {
  const s = await load()
  s.samples = (s.samples ?? []).filter((x) => !(x.id === id && x.owner === owner))
  if (!s.samples.some((x) => x.owner === owner)) delete s.styles?.[owner]
  await save(s)
}

// Read the samples and describe how this student writes (shown as cards, fed into every condense).
export async function refreshStyle(owner: string) {
  const samples = (await samplesFor(owner)).samples.filter((x) => x.chars > 0)
  if (!samples.length) throw new Error("Add at least one of your own notes first.")
  const out = await chatJson<{ traits: Trait[] }>([
    {
      role: "system",
      content: `You study a student's own notes and describe HOW they write, so an AI can copy their style. Not what the notes are about.
Look at: structure, sentence length, tone, use of examples/analogies, questions to self, symbols/arrows, formulas vs words.
Reply with JSON: {"traits": [{"trait": string (short, e.g. "Intuition before formulas"), "evidence": string (a short quote from the notes, max 12 words)}]} with 3-5 traits.`,
    },
    { role: "user", content: samples.map((x) => `--- ${x.name} ---\n${x.excerpt}`).join("\n\n").slice(0, 20000) },
  ])
  const traits = (out.traits ?? []).filter((t) => t?.trait).slice(0, 5).map((t) => ({ trait: String(t.trait), evidence: String(t.evidence ?? "") }))
  if (!traits.length) throw new Error("The AI reply was empty. Try again.")
  const s = await load()
  ;(s.styles ??= {})[owner] = traits
  await save(s)
  return traits
}

// Slide text from a PDF or PPTX (checked by magic bytes, not the file name).
export async function readDeck(file: File) {
  if (file.size === 0) throw new Error("Choose a file to condense.")
  if (file.size > MAX_DECK) throw new Error("Files must be under 20 MB.")
  const bytes = new Uint8Array(await file.arrayBuffer())
  const head = Buffer.from(bytes.subarray(0, 5)).toString("latin1")
  let slides: string[]
  if (head === "%PDF-") {
    slides = (await extractText(await getDocumentProxy(bytes))).text as string[]
  } else if (head.startsWith("PK") && /\.pptx$/i.test(file.name)) {
    const zip = await JSZip.loadAsync(bytes)
    const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
    slides = await Promise.all(names.map(async (n) => [...(await zip.file(n)!.async("string")).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(" ")))
  } else throw new Error("PDF or PowerPoint (.pptx) only.")
  const total = slides.length
  const slide_texts = slides.slice(0, MAX_SLIDES).map((t) => t.replace(/\s+/g, " ").trim())
  const text = slides.slice(0, MAX_SLIDES).map((t, i) => `[Slide ${i + 1}] ${t.replace(/\s+/g, " ").trim()}`).join("\n").slice(0, MAX_CHARS)
  if (text.replace(/\[Slide \d+\]/g, "").trim().length < 200) throw new Error("This file has no readable text (scanned slides?).")
  return { text, slides: total, truncated: total > MAX_SLIDES, slide_texts, bytes, ext: head === "%PDF-" ? "pdf" as const : "pptx" as const }
}

const LENGTH: Record<Length, string> = { short: "3-4 sections, 2-4 items each", standard: "4-6 sections, 3-6 items each", detailed: "6-9 sections, 4-8 items each" }

export async function condense(owner: string, deck: Awaited<ReturnType<typeof readDeck>>, o: { source: string; module_code: string; length: Length; style: boolean }) {
  const traits = o.style ? (await samplesFor(owner)).traits : []
  const style = traits.length ? `\nThis student's own style (match it closely):\n${traits.map((t) => `- ${t.trait} (e.g. "${t.evidence}")`).join("\n")}` : ""
  const notes = await chatJson<CondensedNotes>([
    {
      role: "system",
      content: `You turn lecture slides into a student's own study notes. They read as if the student wrote them after understanding the lecture.
How they learn: concrete problem first, then name the idea, then a one-line definition. Intuition before formulas. Compare related ideas side by side.
Break hard parts down by asking a question and answering it. Casual plain English, short direct sentences, no padding. Skip title/agenda slides; don't skip any real concept.
Use ONLY the slide text; don't invent facts. Write maths in plain readable form (e.g. "P(j) × N(x; μ, σ²)"), never LaTeX. Wrap the single most important phrase of each section in ==double equals== (highlighter, 1-2 per section).
Length: ${LENGTH[o.length]}.${style}
Reply with JSON: {"title": string, "sections": [{"heading": string, "items": Item[]}], "remember": string[] (3-5 must-remember lines), "check": string[] (3 quick self-test questions)}
Item is one of: {"type":"def","term","text"} | {"type":"point","text","sub"?: string[]} | {"type":"question","q","a"} | {"type":"rule","text"} | {"type":"aside","text"} (aside = analogy or side remark).`,
    },
    { role: "user", content: deck.text },
  ])
  if (!notes?.sections?.length) throw new Error("The AI reply was empty. Try again.")
  const out: Output = {
    id: randomUUID().slice(0, 8), owner, title: String(notes.title || o.source), module_code: o.module_code, source: o.source,
    slides: deck.slides, length: o.length, model: MODEL, styled: traits.length > 0, deck: await saveFile(deck.bytes, deck.ext), slide_texts: deck.slide_texts, date: new Date().toISOString().slice(0, 10),
    notes: { title: String(notes.title || o.source), sections: notes.sections, remember: notes.remember ?? [], check: notes.check ?? [] },
  }
  const s = await load()
  s.outputs.push(out)
  await save(s)
  return out
}
