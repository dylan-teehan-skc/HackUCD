import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { moduleName, slugify, topicSlug, YEARS, type DemoNote } from "@/lib/demo-notes"
import { allNotes, moduleLecturers, moduleTopics, starredIds } from "@/lib/library"
import { routes } from "@/lib/site"
import { NoteRow } from "@/components/library/note-row"
import { FilterBar } from "@/components/library/filter-bar"
import { UploadDialog } from "@/components/library/upload-dialog"
import { cachedSummaries } from "@/lib/summaries"
import { getSession } from "@/lib/session"

export const metadata = { title: "Topic · Margin" }

const PAGE_SIZE = 5
const SORTS = { stars: "Most starred", new: "New" } as const // first = default
type Sort = keyof typeof SORTS
const order: Record<Sort, (a: DemoNote, b: DemoNote) => number> = {
  new: (a, b) => b.updated.localeCompare(a.updated),
  stars: (a, b) => b.stars - a.stars,
}

export default function TopicPage(props: PageProps<"/m/[code]/[topic]">) {
  return (
    <main className="px-6 pb-24 pt-32 md:px-10">
      <Suspense fallback={<p className="label">Loading notes…</p>}>
        <Topic {...props} />
      </Suspense>
    </main>
  )
}

async function Topic({ params, searchParams }: PageProps<"/m/[code]/[topic]">) {
  const { code: rawCode, topic: slug } = await params
  const q = await searchParams
  const code = rawCode.toUpperCase()
  const sort: Sort = q.sort === "new" ? "new" : "stars"
  const inModule = (await allNotes()).filter((n) => n.module_code === code)
  const [topics, known] = await Promise.all([moduleTopics(code), moduleLecturers(code)])
  const topic = topics.find((t) => topicSlug(t) === slug)
  const inTopic = inModule.filter((n) => n.topic === topic)
  // Lecturer filter: this year's lecturer first, then earlier ones.
  const lecturers = [...known, ...inTopic.map((n) => n.lecturer)].filter((l, i, a) => a.indexOf(l) === i)
  const lecturer = lecturers.find((l) => slugify(l) === q.lecturer)
  const year = YEARS.find((y) => y === q.year)
  const list = inTopic.filter((n) => (!lecturer || n.lecturer === lecturer) && (!year || n.year === year)).sort(order[sort])
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Number(q.page) || 1))
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const [summaries, mine] = await Promise.all([cachedSummaries(shown), getSession().then((x) => starredIds(x?.email))])
  const href = (p: number, s: Sort = sort) => {
    const qs = new URLSearchParams({ ...(s !== "stars" && { sort: s }), ...(lecturer && { lecturer: slugify(lecturer) }), ...(year && { year }), ...(p > 1 && { page: String(p) }) }).toString()
    return `${routes.topic(code, slug)}${qs ? `?${qs}` : ""}`
  }

  return (
    <>
      <Link href={routes.module(code)} className="label flex w-fit items-center gap-1 hover:text-white">
        <ArrowLeft className="size-3" /> {code} · {moduleName(code) ?? "Module"}
      </Link>
      <h1 className="font-display mt-8 text-4xl font-bold uppercase tracking-tight md:text-6xl">{topic ?? "Topic not found"}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg text-white/60">{list.length} {list.length === 1 ? "note" : "notes"}{(lecturer || year) && " matching your filters"}, ranked by students.</p>
        {topic && (await getSession())?.profile?.module_codes.includes(code) && (
          <UploadDialog code={code} topic={topic} topics={topics} lecturers={known} years={YEARS} />
        )}
      </div>

      <FilterBar
        sorts={(Object.keys(SORTS) as Sort[]).map((k) => ({ value: k, label: SORTS[k] }))}
        lecturers={lecturers.map((l, i) => ({ value: slugify(l), label: i === 0 ? `${l} (current)` : l, count: inTopic.filter((n) => n.lecturer === l).length }))}
        years={YEARS.map((y) => ({ value: y, label: y, count: inTopic.filter((n) => n.year === y).length }))}
      />

      {shown.length ? (
        <ol className="mt-6 space-y-2">
          {shown.map((note, i) => {
            const rank = (page - 1) * PAGE_SIZE + i + 1
            return <NoteRow key={note.id} note={note} rank={rank} starred={mine.has(note.id)} summary={summaries[note.id]} />
          })}
        </ol>
      ) : (
        <p className="py-8 text-white/50">{lecturer || year ? "No notes match these filters." : "No notes yet. Be the first to share yours."}</p>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
          <PageLink href={href(page - 1)} disabled={page === 1}><ChevronLeft className="size-4" /> Previous</PageLink>
          <span className="label">Page {page} of {pages}</span>
          <PageLink href={href(page + 1)} disabled={page === pages}>Next <ChevronRight className="size-4" /></PageLink>
        </nav>
      )}
    </>
  )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  return disabled
    ? <span className="flex items-center gap-1 text-white/20">{children}</span>
    : <Link href={href} className="flex items-center gap-1 border border-white/15 px-3 py-2 hover:border-white">{children}</Link>
}
