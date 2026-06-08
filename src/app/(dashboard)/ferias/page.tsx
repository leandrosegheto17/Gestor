import { GerenciadorFerias } from "@/components/ferias/GerenciadorFerias"

export default function PaginaFerias() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Férias</h1>
        <p className="text-sm text-muted-foreground">
          Controle de períodos de férias — visualização em lista e calendário
        </p>
      </div>
      <GerenciadorFerias />
    </div>
  )
}
