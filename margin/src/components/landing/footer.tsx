import Link from "next/link"
import { routes } from "@/lib/site"

// ponytail: "#" links are placeholders until those pages exist.
const columns = [
  { title: "Product", links: [["Library", routes.library], ["Condense", routes.condense], ["Pricing", "#"], ["How review works", "#"]] },
  { title: "Students", links: [["Upload notes", routes.library], ["Top contributors", "#"], ["Request a module", "#"], ["Guidelines", "#"]] },
  { title: "Social", links: [["Instagram", "#"], ["TikTok", "#"], ["LinkedIn", "#"], ["GitHub", "#"]] },
]
const legal = ["Privacy", "Terms", "Academic Integrity", "Content Removal"]

export function Footer() {
  return (
    <footer className="grid gap-16 px-6 py-16 md:grid-cols-2 md:px-10 md:py-20">
      <div className="font-display text-2xl font-bold tracking-tight">MARGIN</div>
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
        {columns.map((c) => (
          <div key={c.title}>
            <p className="label mb-8">{c.title}</p>
            <ul className="space-y-2 text-lg">
              {c.links.map(([name, href]) => (
                <li key={name}><Link href={href} className="hover:text-white/60">{name}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-medium uppercase">Copyright © 2026 Margin</p>
        <ul className="mt-4 space-y-1 text-sm text-white/50">
          {legal.map((l) => <li key={l}><Link href="#" className="hover:text-white">{l}</Link></li>)}
        </ul>
        <p className="mt-6 text-xs text-white/30">Not affiliated with UCD. Demo data shown.</p>
      </div>
      <div className="md:justify-self-end">
        <p className="label mb-6">Contact</p>
        <a href="mailto:hello@margin.study" className="text-lg hover:text-white/60">hello@margin.study</a>
      </div>
    </footer>
  )
}
