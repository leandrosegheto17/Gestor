import { PlanilhaSalarial } from "@/components/salario/PlanilhaSalarial"

export default function PaginaPlanilhaSalarial() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planilha Salarial</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada dos salários — agrupável por projeto ou senioridade
        </p>
      </div>
      <PlanilhaSalarial />
    </div>
  )
}
