import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "./reveal"
import { routes } from "@/lib/site"
import { getSession } from "@/lib/session"

export function Hero() {
  return (
    <section className="px-6 pt-20 md:px-10">
      <div className="relative h-[calc(100svh-6.5rem)] min-h-[520px] overflow-hidden">
        <Image src="/media/hero-library-v3.jpg" alt="" fill priority className="scale-105 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
          <Reveal>
            <p className="label mb-6">Built by students · Verified by course · Ranked by stars</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display max-w-5xl text-5xl font-bold uppercase leading-[0.92] tracking-tight md:text-8xl">
              Margin
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-white/75 md:text-2xl">Where students share what they know.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <Suspense fallback={<div className="mt-10 h-12" />}>
              <Cta />
            </Suspense>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// Signed in → straight to your modules; otherwise sign in. Reads the cookie, so it streams in.
async function Cta() {
  const signedIn = !!(await getSession())?.profile
  return (
    <Button asChild size="lg" className="mt-10 h-12 rounded-none bg-white px-6 text-black hover:bg-white/85">
      <Link href={signedIn ? routes.library : routes.login}>
        {signedIn ? "Go to your modules" : "Sign in with student email"} <ArrowRight />
      </Link>
    </Button>
  )
}
