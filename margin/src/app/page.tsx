import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { Stats } from "@/components/landing/stats"
import { Feature } from "@/components/landing/feature"
import { Flow } from "@/components/landing/flow"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Feature index="01" title="Share" body="Upload your notes to your module. Only verified students in the course can see them." image="/media/share.jpg" />
        <Feature index="02" title="Rank" body="Students star what helped. The best notes rise to the top, not the newest." image="/media/rank.jpg" />
        <Feature index="03" title="Condense" body="Drop in lecture slides. Get notes written the way you learn, from your own past notes." image="/media/condense-01.png" paper />
        <Flow />
      </main>
      <Footer />
    </>
  )
}
