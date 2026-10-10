import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/login/login-form"
import { areas } from "@/lib/ucd"
import { courseModules } from "@/lib/demo-data"

export const metadata = { title: "Log in · Margin" }

export default function LoginPage() {
  return (
    <main className="relative grid min-h-svh place-items-center px-4 pb-16 pt-28">
      <Image src="/media/hero-library-v3.jpg" alt="" fill priority className="-z-10 object-cover opacity-25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      <div className="flex w-full flex-col items-center">
        <Suspense>
          <LoginForm areas={areas} courseModules={courseModules} />
        </Suspense>
        <p className="label mt-8 text-center">Students only</p>
      </div>
    </main>
  )
}
