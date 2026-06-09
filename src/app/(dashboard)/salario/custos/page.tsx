import { CustoPorProjeto } from "@/components/salario/CustoPorProjeto"

export default function PaginaCustoPorProjeto() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custo por Projeto</h1>
        <p className="text-sm text-muted-foreground">
          Amostragem de custo empresa — salário bruto + encargos CLT + benefícios
        </p>
      </div>
      <CustoPorProjeto />
    </div>
  )
}
