import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Star } from "lucide-react"
import { moduleName, topicSlug } from "@/lib/demo-notes"
import { allNotes, moduleLecturers, moduleTopics } from "@/lib/library"
import { routes } from "@/lib/site"
import { YEARS } from "@/lib/demo-notes"
import { getSession } from "@/lib/session"
import { UploadDialog } from "@/components/library/upload-dialog"
import { NewTopicDialog } from "@/components/library/new-topic-dialog"

export const metadata = { title: "Module · Margin" }

export default function ModulePage(props: PageProps<"/m/[code]">) {
  return (
    <main className="px-6 pb-24 pt-32 md:px-10">
      <Suspense fallback={<p className="label">Loading module…</p>}>
        <Module {...props} />
      </Suspense>
    </main>
  )
}

async function Module({ params }: PageProps<"/m/[code]">) {
  const code = (await params).code.toUpperCase()
  const list = (await allNotes()).filter((n) => n.module_code === code)
  const [topics, lecturers] = await Promise.all([moduleTopics(code), moduleLecturers(code)])
  const canUpload = !!(await getSession())?.profile?.module_codes.includes(code)

  return (
    <>
      <Link href={routes.library} className="label flex w-fit items-center gap-1 hover:text-white">
        <ArrowLeft className="size-3" /> Your modules
      </Link>
      <h1 className="font-display mt-8 text-4xl font-bold uppercase tracking-tight md:text-6xl">{moduleName(code) ?? "Your module"}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg text-white/60">{topics.length} topics · {list.length} notes. Pick a topic.</p>
        {canUpload && (
          <div className="flex gap-2">
            <NewTopicDialog code={code} />
            {topics.length > 0 && <UploadDialog code={code} topics={topics} lecturers={lecturers} years={YEARS} />}
          </div>
        )}
      </div>

      {topics.length ? (
        <div className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const inTopic = list.filter((n) => n.topic === t)
            const best = [...inTopic].sort((a, b) => b.stars - a.stars)[0]
            return (
              <Link key={t} href={routes.topic(code, topicSlug(t))}
                className="group flex min-h-48 flex-col justify-between border border-white/[0.06] bg-charcoal p-6 transition hover:border-white/20 hover:bg-charcoal-hover">
                <div>
                  <p className="label">{inTopic.length} {inTopic.length === 1 ? "note" : "notes"}</p>
                  <h2 className="mt-3 text-2xl leading-tight">{t}</h2>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <p className="min-w-0 text-sm text-white/45">
                    {best ? <>Top: <span className="text-white/70">{best.title}</span> <Star className="mb-0.5 inline size-3 fill-star text-star" /> {best.stars}</> : "No notes yet · be the first"}
                  </p>
                  <ArrowRight className="size-5 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="mt-12 border-t border-white/10 pt-6 text-white/50">No topics yet for {code}. Add the first one.</p>
      )}
    </>
  )
}
