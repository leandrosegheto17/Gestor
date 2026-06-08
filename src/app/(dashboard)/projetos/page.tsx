import { GerenciadorProjetos } from "@/components/projetos/GerenciadorProjetos"

export default function PaginaProjetos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projetos</h1>
        <p className="text-sm text-muted-foreground">
          Gerenciamento de projetos do time
        </p>
      </div>
      <GerenciadorProjetos />
    </div>
  )
}
