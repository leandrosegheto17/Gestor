import { GerenciadorOcorrencias } from "@/components/ocorrencias/GerenciadorOcorrencias"

export default function PaginaOcorrencias() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ocorrências</h1>
        <p className="text-sm text-muted-foreground">
          Registro de ocorrências positivas e negativas
        </p>
      </div>
      <GerenciadorOcorrencias />
    </div>
  )
}
