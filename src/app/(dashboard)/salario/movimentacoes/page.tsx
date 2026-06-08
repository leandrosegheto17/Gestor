import { GerenciadorMovimentacoes } from "@/components/salario/GerenciadorMovimentacoes"

export default function PaginaMovimentacoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimentações Salariais</h1>
        <p className="text-sm text-muted-foreground">
          Propostas de reajuste por ciclo — o salário proposto é calculado automaticamente
        </p>
      </div>
      <GerenciadorMovimentacoes />
    </div>
  )
}
