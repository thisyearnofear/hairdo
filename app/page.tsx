import { Header } from "@/components/Header"
import { HeroNew } from "@/components/HeroNew"
import { HairstyleNew } from "@/components/HairstyleNew"
import { Footer } from "@/components/Footer"

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl px-4">
      <Header />
      <HeroNew />
      <HairstyleNew />
      <Footer />
    </div>
  )
}
