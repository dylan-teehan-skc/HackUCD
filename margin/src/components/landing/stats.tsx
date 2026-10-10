import { stats } from "@/lib/site"

export function Stats() {
  return (
    <section className="mx-6 grid grid-cols-3 border-b border-white/10 md:mx-10">
      {stats.map((s) => (
        <div key={s.label} className="py-10 md:py-14">
          <div className="font-display text-3xl font-bold md:text-5xl">{s.value}</div>
          <div className="label mt-2">{s.label}</div>
        </div>
      ))}
    </section>
  )
}
