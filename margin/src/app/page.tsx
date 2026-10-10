import { Hero } from "@/components/landing/hero"
import { Stats } from "@/components/landing/stats"
import { Feature } from "@/components/landing/feature"
import { Flow } from "@/components/landing/flow"
import { Footer } from "@/components/landing/footer"
import { UniLogos } from "@/components/landing/uni-logos"
import { CondenseVisual } from "@/components/landing/condense-visual"
import { RankVisual } from "@/components/landing/rank-visual"

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Stats />
        <Feature index="01" title="Share" body="Upload your notes to your module. Only verified students in the course can see them." media={<UniLogos />} />
        <Feature index="02" title="Rank" body="Students star what helped. The best notes rise to the top, not the newest." media={<RankVisual />} />
        <Feature index="03" title="Condense" body="Drop in lecture slides. Get notes written the way you learn, from your own past notes." media={<CondenseVisual />} />
        <Flow />
      </main>
      <Footer />
    </>
  )
}
