import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/components/login/login-form"
import { modules } from "@/lib/demo-data"
import { routes } from "@/lib/site"

export const metadata = { title: "Sign in · Margin" }

export default function LoginPage() {
  return (
    <main className="relative grid min-h-svh place-items-center px-4 py-16">
      <Image src="/media/hero.jpg" alt="" fill priority className="-z-10 object-cover opacity-25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      <div className="w-full max-w-sm">
        <Link href={routes.home} className="font-display mb-10 block text-center text-2xl font-bold tracking-tight">
          MARGIN
        </Link>
        <LoginForm modules={modules} />
        <p className="label mt-8 text-center">Students only · Not affiliated with any university</p>
      </div>
    </main>
  )
}
