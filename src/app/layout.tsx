import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Provedores } from "./provedores"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestor de Times",
  description: "Gestão centralizada do time de tecnologia",
}

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Provedores>{children}</Provedores>
      </body>
    </html>
  )
}
