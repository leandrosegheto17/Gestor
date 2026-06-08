import { Suspense } from "react"
import { FormularioLogin } from "./FormularioLogin"

export default function PaginaLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Gestor de Times</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça login para continuar
          </p>
        </div>
        <Suspense>
          <FormularioLogin />
        </Suspense>
      </div>
    </div>
  )
}
