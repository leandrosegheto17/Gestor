import { GerenciadorFeedbacks } from "@/components/feedbacks/GerenciadorFeedbacks"

export default function PaginaFeedbacks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedbacks</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de feedbacks por colaborador
        </p>
      </div>
      <GerenciadorFeedbacks />
    </div>
  )
}
