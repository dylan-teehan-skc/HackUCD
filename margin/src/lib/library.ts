import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { moduleMeta, notes as seed, type DemoNote } from "./demo-notes"

// ponytail: JSON-file store for uploads, suggested edits and version history (hackathon).
// Swap for Supabase tables `notes`, `note_versions`, `suggestions` + Storage (docs/BACKEND_PLAN.md).
export type Version = { version: number; file: string; editor: string; summary: string; date: string }
export type Suggestion = {
  id: string
  note_id: string
  proposer: string // email
  reason: string
  page?: number
  file?: string // optional replacement PDF
  status: "pending" | "approved" | "rejected"
  created: string
  reviewed?: string
}
type Store = {
  notes: DemoNote[]
  versions: Record<string, Version[]>
  suggestions: Suggestion[]
  topics?: Record<string, string[]> // student-created topics per module
  lecturers?: Record<string, string[]> // student-added lecturers per module
  stars?: Record<string, string[]> // email → starred note ids (= that student's favourites)
  tips?: Tip[] // paid Stripe tips to note authors
  accounts?: Record<string, string> // author email → Stripe connected account id (Connect, Accounts v2)
}
// Tips are charged by the platform, then 90% is transferred to the author's connected account
// (held until they finish payout setup). `transfer` set = paid out.
export type Tip = { session: string; note_id: string; author: string; from: string; item: string; amount: number; charge?: string; transfer?: string; date: string }

const DIR = ".data", FILE = `${DIR}/library.json`, FILES = `${DIR}/files`
export const MAX_PDF = 20 * 1024 * 1024
const today = () => new Date().toISOString().slice(0, 10)
export const handle = (email: string) => email.split("@")[0]

async function load(): Promise<Store> {
  try { return JSON.parse(await readFile(FILE, "utf8")) } catch { return { notes: [], versions: {}, suggestions: [] } }
}
async function save(s: Store) {
  await mkdir(DIR, { recursive: true })
  await writeFile(FILE, JSON.stringify(s, null, 2))
}

// Current state of a note = seed/uploaded row + its latest approved version.
const withLatest = (n: DemoNote, v: Version[] = []) => {
  const last = v.at(-1)
  return last ? { ...n, file: last.file, version: last.version, updated: last.date } : { ...n, version: n.version ?? 1 }
}

// Seed star counts + real student stars.
const starCount = (s: Store, id: string) => Object.values(s.stars ?? {}).filter((ids) => ids.includes(id)).length

export async function allNotes() {
  const s = await load()
  return [...seed, ...s.notes].map((n) => ({ ...withLatest(n, s.versions[n.id]), stars: n.stars + starCount(s, n.id) }))
}

export async function starredIds(email: string | undefined) {
  return new Set(email ? (await load()).stars?.[email] ?? [] : [])
}

// Star = favourite. Toggles and returns the new state and count.
export async function toggleStar(email: string, id: string) {
  const s = await load()
  const base = [...seed, ...s.notes].find((n) => n.id === id)
  if (!base) throw new Error("Note not found.")
  const mine = ((s.stars ??= {})[email] ??= [])
  const starred = !mine.includes(id)
  s.stars[email] = starred ? [...mine, id] : mine.filter((x) => x !== id)
  await save(s)
  return { starred, count: base.stars + starCount(s, id), module_code: base.module_code }
}

export async function getNote(id: string) {
  const s = await load()
  const base = [...seed, ...s.notes].find((n) => n.id === id)
  if (!base) return null
  const versions: Version[] = s.versions[id] ?? []
  const history: Version[] = [
    { version: 1, file: base.file ?? "", editor: base.owner ? handle(base.owner) : base.author, summary: "Uploaded", date: base.updated },
    ...versions,
  ]
  return { note: { ...withLatest(base, versions), stars: base.stars + starCount(s, id) }, history: history.reverse(), suggestions: s.suggestions.filter((x) => x.note_id === id) }
}

// Validates and stores an uploaded PDF; returns its served URL and page count.
export async function savePdf(file: File) {
  if (file.size === 0) throw new Error("Choose a PDF to upload.")
  if (file.size > MAX_PDF) throw new Error("PDFs must be under 20 MB.")
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("That file isn't a PDF.")
  const name = `${randomUUID()}.pdf`
  await mkdir(FILES, { recursive: true })
  await writeFile(`${FILES}/${name}`, bytes)
  // ponytail: counts page objects in the raw bytes; misses compressed object streams (shows 1). Use pdf-lib if it matters.
  const pages = bytes.toString("latin1").match(/\/Type\s*\/Page(?!s)/g)?.length || 1
  return { url: `/api/files/${name}`, pages }
}

export async function addNote(n: Omit<DemoNote, "id" | "stars" | "views" | "updated" | "version">) {
  const s = await load()
  const note: DemoNote = { ...n, id: `u${randomUUID().slice(0, 8)}`, stars: 0, views: 0, updated: today(), version: 1 }
  s.notes.push(note)
  await save(s)
  return note
}

export async function addSuggestion(x: Pick<Suggestion, "note_id" | "proposer" | "reason" | "page" | "file">) {
  const s = await load()
  s.suggestions.push({ ...x, id: randomUUID().slice(0, 8), status: "pending", created: today() })
  await save(s)
}

// Author approves → new version (with the replacement PDF if one was attached). History is never rewritten.
export async function reviewSuggestion(id: string, approve: boolean, reviewer: string) {
  const s = await load()
  const sug = s.suggestions.find((x) => x.id === id && x.status === "pending")
  if (!sug) throw new Error("Suggestion not found.")
  const note = [...seed, ...s.notes].find((n) => n.id === sug.note_id)
  if (!note?.owner || note.owner !== reviewer) throw new Error("Only the author can review suggestions.")
  sug.status = approve ? "approved" : "rejected"
  sug.reviewed = today()
  if (approve) {
    const v = (s.versions[note.id] ??= [])
    const current = withLatest(note, v)
    v.push({ version: (current.version ?? 1) + 1, file: sug.file ?? current.file ?? "", editor: handle(sug.proposer), summary: sug.reason, date: today() })
  }
  await save(s)
}

const uniq = (xs: string[]) => xs.filter((x, i) => xs.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i)

// A module's topics/lecturers = seed + student-added + any that notes mention.
export async function moduleTopics(code: string) {
  const s = await load()
  return uniq([...(moduleMeta[code]?.topics ?? []), ...(s.topics?.[code] ?? []), ...[...seed, ...s.notes].filter((n) => n.module_code === code).map((n) => n.topic)])
}
export async function moduleLecturers(code: string) {
  const s = await load()
  return uniq([...(moduleMeta[code]?.lecturers ?? []), ...(s.lecturers?.[code] ?? [])])
}

export async function addTopic(code: string, name: string) {
  const s = await load()
  if ((await moduleTopics(code)).some((t) => t.toLowerCase() === name.toLowerCase())) throw new Error("That topic already exists.")
  ;((s.topics ??= {})[code] ??= []).push(name)
  await save(s)
}

export async function addLecturer(code: string, name: string) {
  if ((await moduleLecturers(code)).some((l) => l.toLowerCase() === name.toLowerCase())) return
  const s = await load()
  ;((s.lecturers ??= {})[code] ??= []).push(name)
  await save(s)
}

// Record a paid tip once (Stripe session id is the idempotency key).
export async function addTip(t: Omit<Tip, "date">) {
  const s = await load()
  if ((s.tips ??= []).some((x) => x.session === t.session)) return false
  s.tips.push({ ...t, date: today() })
  await save(s)
  return true
}
export async function tipsFor(noteId: string) {
  return ((await load()).tips ?? []).filter((t) => t.note_id === noteId)
}

export async function connectedAccount(email: string) {
  return (await load()).accounts?.[email] ?? null
}
export async function saveConnectedAccount(email: string, id: string) {
  const s = await load()
  ;(s.accounts ??= {})[email] = id
  await save(s)
}
export async function tipsForAuthor(email: string) {
  return ((await load()).tips ?? []).filter((t) => t.author === email)
}
export async function markTransferred(session: string, transfer: string) {
  const s = await load()
  const t = s.tips?.find((x) => x.session === session)
  if (t) { t.transfer = transfer; await save(s) }
}
