// One helper for every OpenRouter call (docs/BACKEND_PLAN.md). Plain fetch, no SDK.
const URL = "https://openrouter.ai/api/v1/chat/completions"
// Free models (rate-limited per model). OpenRouter tries them in order, so one busy model doesn't block us.
export const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free"
const FALLBACKS = ["dots-studio/dots-3-note-preview:free", "google/gemma-4-31b-it:free"]

// Free models that read images (handwritten notes). Same fallback idea as text.
export const VISION = ["dots-studio/dots-3-note-preview:free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"] // dots is fastest (~30s/page); gemma often rate-limited

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
type Message = { role: "system" | "user"; content: string | Part[] }

export async function chatJson<T>(messages: Message[], only?: string[], timeout = 90_000): Promise<T> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error("AI isn't set up: add OPENROUTER_API_KEY to .env.local and restart the dev server.")
  const models = (only ?? [MODEL, ...FALLBACKS.filter((m) => m !== MODEL)]).slice(0, 3) // OpenRouter allows max 3
  const body = JSON.stringify({ models, messages, response_format: { type: "json_object" }, temperature: 0.2 })
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "http://localhost:3000", "X-Title": "Margin" }
  // One retry: covers a flaky call or a reply that isn't valid JSON.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(URL, { method: "POST", headers, body, signal: AbortSignal.timeout(timeout) })
    if (res.status === 401) throw new Error("OpenRouter rejected the API key.")
    if (res.status === 402) throw new Error("OpenRouter account is out of credits.")
    if (res.status === 429) throw new Error("All the free AI models are busy (rate limit). Wait a minute and try again.")
    if (!res.ok) { if (attempt) throw new Error(`OpenRouter error ${res.status}.`); continue }
    const text: string = (await res.json()).choices?.[0]?.message?.content ?? ""
    try { return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T } catch { if (attempt) throw new Error("The AI reply wasn't readable. Try again.") }
  }
  throw new Error("AI request failed.")
}
