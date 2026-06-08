"use client"

import { SessionProvider } from "next-auth/react"

export function Provedores({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
