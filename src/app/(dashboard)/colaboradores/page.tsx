import { GerenciadorColaboradores } from "@/components/colaboradores/GerenciadorColaboradores"

export default function PaginaColaboradores() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <p className="text-sm text-muted-foreground">
          Gerenciamento dos membros do time
        </p>
      </div>
      <GerenciadorColaboradores />
    </div>
  )
}
