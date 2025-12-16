import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { Web3Provider } from "@/components/Web3Provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const title = "Change Hairstyle AI for FREE"
const description = "Get a new hairstyle in seconds, for free."
const image = "https://changehairstyleai.com/cover.jpg"

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
      <body className={inter.className}>
        <Web3Provider>
          <div 
            className="min-h-screen"
            style={{
              background: 'radial-gradient(80% 130% at 50% -30%, rgba(0, 0, 0, .15) 0, rgba(0, 0, 0, 0) 100%)'
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
