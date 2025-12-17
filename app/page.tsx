import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { Hairstyle } from "@/components/Hairstyle"
import { Footer } from "@/components/Footer"

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl px-4">
      <Header />
      <Hero />
      <Hairstyle />
      <Footer />
    </div>
  )
}
