import { PerfilColaborador } from "@/components/desempenho/PerfilColaborador"

interface Props {
  params: { id: string }
}

export default function PaginaPerfilColaborador({ params }: Props) {
  return (
    <div className="space-y-6">
      <PerfilColaborador id={params.id} />
    </div>
  )
}
