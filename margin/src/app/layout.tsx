import type { Metadata } from "next"
import { Archivo, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const display = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] })

export const metadata: Metadata = {
  title: "Margin",
  description: "Course-verified student notes, ranked by stars. Slides condensed into notes in your style.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable} ${display.variable} antialiased`}>
      <body className="min-h-svh">{children}</body>
    </html>
  )
}
