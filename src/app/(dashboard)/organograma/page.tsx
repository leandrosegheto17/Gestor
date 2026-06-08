import { ArvoreOrganograma } from "@/components/organograma/ArvoreOrganograma"

export default function PaginaOrganograma() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organograma</h1>
        <p className="text-sm text-muted-foreground">
          Hierarquia do time gerada a partir dos vínculos de liderança
        </p>
      </div>
      <ArvoreOrganograma />
    </div>
  )
}
