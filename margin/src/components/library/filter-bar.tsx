"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Option = { value: string; label: string; count?: number }
const ALL = "all"

// Sort tabs on the left; independent Lecturer and Year dropdowns on the right. State lives in the URL.
export function FilterBar({ sorts, lecturers, years }: { sorts: Option[]; lecturers: Option[]; years: Option[] }) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const sort = params.get("sort") ?? sorts[0].value

  const url = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    next.delete("page") // any filter change goes back to page 1
    if (!value || value === ALL || (key === "sort" && value === sorts[0].value)) next.delete(key)
    else next.set(key, value)
    const qs = next.toString()
    return qs ? `${path}?${qs}` : path
  }
  const active = params.has("lecturer") || params.has("year")
  const clear = () => {
    const next = new URLSearchParams(params)
    ;["lecturer", "year", "page"].forEach((k) => next.delete(k))
    return next.size ? `${path}?${next}` : path
  }

  return (
    <div className="mt-10 flex flex-col gap-4 border-b border-white/10 md:flex-row md:items-end md:justify-between">
      <div className="flex gap-6 text-sm">
        {sorts.map((s) => (
          <Link key={s.value} href={url("sort", s.value)}
            className={`-mb-px border-b pb-3 ${sort === s.value ? "border-white" : "border-transparent text-white/40 hover:text-white"}`}>
            {s.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        {active && (
          <Link href={clear()}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white">
            <X className="size-3" /> Clear
          </Link>
        )}
        <Dropdown label="Lecturer" value={params.get("lecturer") ?? ALL} options={lecturers} onChange={(v) => router.push(url("lecturer", v))} />
        <Dropdown label="Year" value={params.get("year") ?? ALL} options={years} onChange={(v) => router.push(url("year", v))} />
      </div>
    </div>
  )
}

function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-9 min-w-40 rounded-none border-white/15 text-sm">
        <span className="label mr-1">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-none">
        <SelectItem value={ALL}>All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.count === 0}>
            {o.label} <span className="text-white/35">{o.count}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
