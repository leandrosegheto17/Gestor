import { IndicadoresDashboard } from "@/components/indicadores/IndicadoresDashboard"

export default function PaginaDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel de Indicadores</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada do time — gráficos e alertas em tempo real
        </p>
      </div>
      <IndicadoresDashboard />
    </div>
  )
}
