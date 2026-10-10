import Link from "next/link"
import { routes } from "@/lib/site"

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/80 backdrop-blur">
      <nav className="mx-auto flex h-20 items-center justify-between px-6 md:px-10">
        <Link href={routes.home} className="font-display text-2xl font-bold tracking-tight">
          MARGIN
        </Link>
        <div className="hidden gap-10 text-[15px] md:flex">
          <Link href={routes.library} className="text-white/80 transition hover:text-white">Library</Link>
          <Link href={routes.condense} className="text-white/80 transition hover:text-white">Condense</Link>
        </div>
        <Link href={routes.login} className="text-[15px] text-white/80 transition hover:text-white">
          Sign in
        </Link>
      </nav>
    </header>
  )
}
