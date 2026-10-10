import Link from "next/link"
import { routes } from "@/lib/site"

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-6 pt-20 text-center">
      <div>
        <p className="label">404</p>
        <h1 className="font-display mt-4 text-5xl font-bold uppercase tracking-tight">Page not found</h1>
        <p className="mt-4 text-white/60">That page doesn&apos;t exist, or the note was removed.</p>
        <Link href={routes.library} className="mt-8 inline-block bg-white px-5 py-3 text-black hover:bg-white/85">Go to your modules</Link>
      </div>
    </main>
  )
}
