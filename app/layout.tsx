import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import Script from "next/script"
import { Web3Provider } from "@/components/Web3Provider"
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
        <Web3Provider>
          <div
            className="min-h-screen bg-[#0a0807]"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(217, 164, 76, 0.08) 0%, rgba(180, 80, 40, 0.04) 30%, #0a0807 60%)'
            }}
          >
            {children}
          </div>
        </Web3Provider>
        
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
