import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import { Header } from "@/components/header"
import { NotificationProvider } from "@/components/providers/notification-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Agora - The Public Square",
  description: "Share your thoughts with the world",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
      <Providers>
        <NotificationProvider>
          <Header />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        </NotificationProvider>
      </Providers>
      <Analytics />
      </body>
      </html>
  )
}