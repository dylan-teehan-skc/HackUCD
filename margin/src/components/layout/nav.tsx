import { Suspense } from "react"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { logOut } from "@/app/login/actions"
import { routes } from "@/lib/site"

const link = "text-[15px] text-white/80 transition hover:text-white"

// Reads the session cookie, so it streams in under <Suspense> (cacheComponents).
async function Account() {
  const session = await getSession()
  if (!session?.profile) return <Link href={routes.login} className={link}>Log in</Link>
  return (
    <form action={logOut} className="flex items-center gap-6">
      <Link href={routes.me} className={`${link} hidden sm:inline`}>Your tips</Link>
      <span className="hidden font-mono text-xs text-white/40 lg:inline">{session.email}</span>
      <button className={link}>Log out</button>
    </form>
  )
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/80 backdrop-blur">
      <nav className="mx-auto grid h-20 grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10">
        <Link href={routes.home} className="font-display justify-self-start text-2xl font-bold tracking-tight">
          MARGIN
        </Link>
        <div className="hidden gap-10 md:flex">
          <Link href={routes.library} className={link}>Library</Link>
          <Link href={routes.favourites} className={link}>Favourites</Link>
          <Link href={routes.condense} className={link}>Condense</Link>
        </div>
        <div className="col-start-3 flex justify-end">
          <Suspense fallback={<span className={link}>&nbsp;</span>}>
            <Account />
          </Suspense>
        </div>
      </nav>
    </header>
  )
}
