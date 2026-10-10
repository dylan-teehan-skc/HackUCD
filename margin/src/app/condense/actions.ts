"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import { after } from "next/server"
import { addSamples, condense, deleteOutput, readDeck, readPendingSamples, refreshStyle, removeSample, retrySample, type Length } from "@/lib/condense"
import { routes } from "@/lib/site"

export type CondenseState = { error?: string }
const LENGTHS: Length[] = ["short", "standard", "detailed"]

async function student() {
  const s = await getSession()
  if (!s?.profile) redirect(routes.login)
  return s.profile
}

// Slides (PDF/PPTX) → notes via OpenRouter, then open the result in the Outputs tab.
export async function condenseSlides(_: CondenseState, f: FormData): Promise<CondenseState> {
  const me = await student()
  const file = f.get("file") as File | null
  const module_code = String(f.get("module_code") ?? "")
  const length = String(f.get("length")) as Length
  if (!file) return { error: "Choose a file to condense." }
  if (!me.module_codes.includes(module_code)) return { error: "Pick one of your modules." }
  if (!LENGTHS.includes(length)) return { error: "Pick a length." }
  let id: string
  try {
    const deck = await readDeck(file)
    id = (await condense(me.email, deck, { source: file.name.replace(/\.(pdf|pptx)$/i, ""), module_code, length, style: f.get("style") === "on" })).id
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath(routes.condense)
  redirect(`${routes.condense}?tab=outputs&id=${id}`)
}

export async function removeOutput(id: string) {
  const me = await student()
  await deleteOutput(me.email, id)
  revalidatePath(routes.condense)
  redirect(`${routes.condense}?tab=outputs`)
}

// Your notes tab: save all picked files now (instant), read the photos + update your style in the background.
export async function uploadSample(_: CondenseState, f: FormData): Promise<CondenseState> {
  const me = await student()
  const files = (f.getAll("file") as File[]).filter((x) => x.size)
  if (!files.length) return { error: "Choose some of your notes." }
  try { await addSamples(me.email, files) } catch (e) { return { error: (e as Error).message } }
  after(() => readPendingSamples(me.email))
  revalidatePath(routes.condense)
  return {}
}

export async function retry(id: string) {
  const me = await student()
  await retrySample(me.email, id)
  after(() => readPendingSamples(me.email))
  revalidatePath(routes.condense)
}

export async function deleteSample(id: string) {
  const me = await student()
  await removeSample(me.email, id)
  revalidatePath(routes.condense)
}

export async function restyle(): Promise<CondenseState> {
  const me = await student()
  try { await refreshStyle(me.email) } catch (e) { return { error: (e as Error).message } }
  revalidatePath(routes.condense)
  return {}
}
