import dynamic from "next/dynamic"

const ArvoreOrganograma = dynamic(
  () => import("@/components/organograma/ArvoreOrganograma").then((m) => m.ArvoreOrganograma),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Carregando organograma...</p> }
)

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
