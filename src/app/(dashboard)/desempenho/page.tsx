import { RankingDesempenho } from "@/components/desempenho/RankingDesempenho"

export default function PaginaDesempenho() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking de Desempenho</h1>
        <p className="text-sm text-muted-foreground">
          Pontuação calculada com base em feedbacks (por fonte) e ocorrências (por gravidade)
        </p>
      </div>
      <RankingDesempenho />
    </div>
  )
}
