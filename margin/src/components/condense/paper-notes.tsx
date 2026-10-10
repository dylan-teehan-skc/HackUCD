import { Kalam } from "next/font/google"
import type { CondensedNotes, Item } from "@/lib/condense"

// Handwritten-style page. Ink colours carry meaning (Teaching_Structure/prompt.txt): red headers/terms, blue body, black rules, green asides.
const hand = Kalam({ weight: ["400", "700"], subsets: ["latin"] })
const RED = "text-[#b3262e]", BLUE = "text-[#1f2f8f]", BLACK = "text-[#16161a]", GREEN = "text-[#2d7a55]"

// ==phrase== → yellow highlighter stroke.
function Ink({ text }: { text: string }) {
  return String(text).split(/==(.+?)==/g).map((part, i) =>
    i % 2 ? <mark key={i} className="bg-transparent bg-[linear-gradient(transparent_35%,#fff27a_35%,#fff27a_88%,transparent_88%)] px-0.5 text-inherit">{part}</mark> : part)
}

function Row({ item }: { item: Item }) {
  switch (item.type) {
    case "def": return <p className={BLUE}><span className={`${RED} font-bold`}>{item.term}:</span> <Ink text={item.text} /></p>
    case "question": return <div><p className={RED}>? <Ink text={String(item.q).replace(/^\?\s*/, "")} /></p><p className={`${BLUE} pl-5`}>→ <Ink text={item.a} /></p></div>
    case "rule": return <p className={`${BLACK} border-2 border-[#16161a] px-3 py-1.5`}><Ink text={item.text} /></p>
    case "aside": return <p className={`${GREEN} italic`}><Ink text={item.text} /></p>
    default: return (
      <div className={BLUE}>
        <p>→ <Ink text={item.text} /></p>
        {item.sub?.map((s) => <p key={s} className="pl-6">↳ <Ink text={s} /></p>)}
      </div>
    )
  }
}

export function PaperNotes({ notes, label }: { notes: CondensedNotes; label: string }) {
  return (
    <article id="paper" className={`${hand.className} relative bg-[#fbf8f1] px-6 py-10 text-[17px] leading-relaxed shadow-[0_30px_80px_rgba(0,0,0,0.7)] md:px-12`}
      style={{ backgroundImage: "radial-gradient(#d9d3c7 1px, transparent 1.2px)", backgroundSize: "22px 22px" }}>
      <p className={`${RED} absolute right-6 top-4 text-sm md:right-12`}>{label}</p>
      <h1 className={`${RED} text-3xl font-bold md:text-4xl`}>{notes.title}</h1>
      <p className="mt-2 text-xs text-[#16161a]/60">
        <span className={RED}>red</span> terms · <span className={BLUE}>blue</span> explaining · <span className={BLACK}>black</span> rules · <span className={GREEN}>green</span> asides
      </p>
      {notes.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className={`${RED} border-b-2 border-[#b3262e] pb-1 text-2xl font-bold`}>{s.heading}</h2>
          <div className="mt-3 space-y-2.5">{s.items.map((it, i) => <Row key={i} item={it} />)}</div>
        </section>
      ))}
      {notes.remember.length > 0 && (
        <section className="mt-10 border-2 border-[#16161a] p-4">
          <h2 className={`${BLACK} text-xl font-bold`}>Worth remembering</h2>
          <ul className={`${BLACK} mt-2 space-y-1`}>{notes.remember.map((r) => <li key={r}>• <Ink text={r} /></li>)}</ul>
        </section>
      )}
      {notes.check.length > 0 && (
        <section className="mt-8">
          <h2 className={`${RED} text-xl font-bold`}>Quick check</h2>
          <ol className={`${BLUE} mt-2 list-decimal space-y-1 pl-6`}>{notes.check.map((q) => <li key={q}>{q}</li>)}</ol>
        </section>
      )}
    </article>
  )
}
