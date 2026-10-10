import { Star } from "lucide-react"

// Demo rows previewing the library's ranked list (synthetic data, same look the /m/[code] page should use).
const notes = [
  { title: "Neural networks, explained step by step", author: "aoife.m", stars: 212, kind: "PDF · 14 pages" },
  { title: "How image recognition works: CNNs in one page", author: "cian.d", stars: 187, kind: "Notes · 1 page" },
  { title: "Past exam questions, fully worked", author: "niamh.k", stars: 96, kind: "PDF · 22 pages" },
  { title: "Overfitting and how to avoid it", author: "luke.b", stars: 41, kind: "Notes · 2 pages" },
]

export function RankVisual() {
  return (
    <div className="border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <span className="font-mono text-xs text-white/50">COMP30760 · Machine Learning</span>
        <div className="flex gap-4 text-xs">
          <span className="border-b border-white pb-0.5">Best</span>
          <span className="text-white/40">New</span>
          <span className="text-white/40">Most starred</span>
        </div>
      </div>
      <ol>
        {notes.map((n, i) => (
          <li key={n.title} className="flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-0">
            <span className="font-display w-8 text-2xl font-bold text-white/30">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm md:text-base">{n.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-white/40">{n.author} · {n.kind}</p>
            </div>
            <span className={`flex items-center gap-1.5 font-mono text-sm ${i === 0 ? "text-star" : "text-white/60"}`}>
              <Star className={`size-4 ${i === 0 ? "fill-current" : ""}`} /> {n.stars}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
