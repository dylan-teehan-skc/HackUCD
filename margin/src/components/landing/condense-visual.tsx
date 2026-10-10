import Image from "next/image"
import { ArrowRight } from "lucide-react"

// A generic PowerPoint-style slide, drawn in CSS (no real lecture content).
function TemplateSlide() {
  return (
    <div className="overflow-hidden border border-white/15 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 bg-[#c43e1c] px-3 py-1.5 text-[10px] font-medium text-white">
        <span className="grid size-4 place-items-center rounded-sm bg-white font-bold text-[#c43e1c]">P</span>
        Lecture 8.pptx
      </div>
      <div className="aspect-video p-[6%] text-neutral-800">
        <p className="text-[clamp(14px,2.2vw,26px)] font-semibold leading-tight">Convolutional Networks</p>
        <div className="mt-[5%] h-px bg-[#c43e1c]/60" />
        <ul className="mt-[5%] space-y-[3.5%] text-[clamp(9px,1.1vw,13px)]">
          {["Images and dense layers", "Locality and weight sharing", "Invariance vs equivariance", "Padding, stride and pooling"].map((t) => (
            <li key={t} className="flex items-center gap-2"><span className="size-1.5 shrink-0 bg-[#c43e1c]" />{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Before → after: slides in, notes in your style out.
export function CondenseVisual() {
  return (
    <div className="flex flex-col items-center gap-8 px-6 py-14 md:flex-row md:gap-6 md:px-10">
      <figure className="w-full md:w-[46%]">
        <TemplateSlide />
        <figcaption className="label mt-3">Your lecture slides · .pptx or .pdf</figcaption>
      </figure>
      <ArrowRight className="size-6 shrink-0 rotate-90 text-white/40 md:rotate-0" />
      <figure className="w-[70%] md:w-[42%]">
        <Image src="/media/condense-notes-v3.png" alt="Handwritten-style study notes generated from slides" width={1640} height={2284}
          className="w-full -rotate-2 shadow-[0_40px_120px_rgba(0,0,0,0.9)]" />
        <figcaption className="label mt-4">Your notes · in your style</figcaption>
      </figure>
    </div>
  )
}
