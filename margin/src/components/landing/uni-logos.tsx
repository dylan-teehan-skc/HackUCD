import Image from "next/image"

// Universities whose student emails can sign up (see lib/student-email.ts). White logos, transparent.
const unis = [
  { src: "/media/unis/ucd.svg", alt: "University College Dublin", w: 206, h: 300, size: "h-24" },
  { src: "/media/unis/ul.svg", alt: "University of Limerick", w: 1480, h: 676, size: "h-20" },
  { src: "/media/unis/tcd.png", alt: "Trinity College Dublin", w: 464, h: 124, size: "h-14" },
  { src: "/media/unis/dcu.png", alt: "Dublin City University", w: 225, h: 58, size: "h-14" },
]

export function UniLogos() {
  return (
    <div className="grid aspect-[16/10] grid-cols-2 gap-px bg-white/10">
      {unis.map((u) => (
        <div key={u.alt} className="grid place-items-center bg-black p-8">
          <Image src={u.src} alt={u.alt} width={u.w} height={u.h} className={`${u.size} w-auto opacity-80`} />
        </div>
      ))}
    </div>
  )
}
