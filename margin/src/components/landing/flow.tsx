import { Reveal } from "./reveal"

const steps = ["Upload", "AI check", "Peer review", "Live", "Suggested edits"]

export function Flow() {
  return (
    <section className="border-y border-white/10 px-6 py-24 md:px-10">
      <Reveal>
        <p className="label mb-10">How a note goes live</p>
        <ol className="grid gap-6 md:grid-cols-5 md:gap-0">
          {steps.map((s, i) => (
            <li key={s} className="border-t border-white/20 pt-4 md:pr-6">
              <span className="label">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 text-xl">{s}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
