import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import Script from "next/script"
import { LazyWeb3Provider } from "@/components/LazyWeb3Provider"
import { Atmosphere } from "@/components/ui/atmosphere"
import { AmbientTrailLazy } from "@/components/ui/ambient-trail-lazy"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

const title = "HAIRDO"
const description = "An agentic style advisor for Black men — discover, visualize, and attest your style."
const image = "https://hairdo.vercel.app/cover.jpg"

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: title,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
    creator: "@pontusaurdal",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID

  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <LazyWeb3Provider>
          <div className="relative min-h-screen">
            {/* Atmosphere — living warm background world */}
            <Atmosphere />
            <AmbientTrailLazy />
            {/* Content sits above atmosphere */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </LazyWeb3Provider>
        
        {gtagId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gtagId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
