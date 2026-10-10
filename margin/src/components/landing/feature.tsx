import Image from "next/image"
import { Reveal } from "./reveal"

type Props = { index: string; title: string; body: string; image?: string; paper?: boolean; media?: React.ReactNode }

// One full-width moment per idea. `paper` = the colourful handwritten notes, shown as an object on black.
export function Feature({ index, title, body, image, paper, media }: Props) {
  return (
    <section className="grid gap-10 px-6 py-24 md:grid-cols-12 md:px-10 md:py-40">
      <Reveal className="md:col-span-4">
        <p className="label">{index}</p>
        <h2 className="font-display mt-4 text-4xl font-bold uppercase leading-none tracking-tight md:text-6xl">{title}</h2>
        <p className="mt-6 max-w-md text-xl leading-snug text-white/60 md:text-2xl">{body}</p>
      </Reveal>
      <Reveal delay={0.15} className="md:col-span-8">
        {media ?? (paper && image ? (
          <div className="flex justify-center bg-neutral-950 py-16">
            <Image src={image} alt="Handwritten-style notes generated from lecture slides" width={907} height={1283}
              className="w-[70%] max-w-md -rotate-2 shadow-[0_40px_120px_rgba(0,0,0,0.9)]" />
          </div>
        ) : (
          <div className="relative aspect-[16/10] overflow-hidden">
            {image && <Image src={image} alt="" fill className="object-cover" />}
          </div>
        ))}
      </Reveal>
    </section>
  )
}
