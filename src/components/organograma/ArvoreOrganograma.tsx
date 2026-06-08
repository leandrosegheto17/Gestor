"use client"

import { useEffect, useState, type ComponentType } from "react"
import { Badge } from "@/components/ui/badge"
import { GitBranch } from "lucide-react"

interface NoColaborador {
  id: string
  nome: string
  funcao: string
  senioridade: string
  subordinados: NoColaborador[]
}

// Tipos mínimos para react-organizational-chart (sem importar o módulo no servidor)
type TreeProps = {
  label: React.ReactNode
  lineWidth?: string
  lineColor?: string
  lineBorderRadius?: string
  nodePadding?: string
  children?: React.ReactNode
}
type TreeNodeProps = {
  label: React.ReactNode
  children?: React.ReactNode
}
interface BibTree {
  Tree: ComponentType<TreeProps>
  TreeNode: ComponentType<TreeNodeProps>
}

const SENIORIDADE_LABELS: Record<string, string> = {
  JUNIOR: "Júnior",
  PLENO: "Pleno",
  SENIOR: "Sênior",
  STAFF: "Staff",
  PRINCIPAL: "Principal",
}

const SENIORIDADE_VARIANTE: Record<
  string,
  "info" | "success" | "warning" | "purple" | "default"
> = {
  JUNIOR: "info",
  PLENO: "success",
  SENIOR: "warning",
  STAFF: "purple",
  PRINCIPAL: "default",
}

function CartaoNo({ no }: { no: NoColaborador }) {
  return (
    <div className="inline-block rounded-lg border bg-card px-4 py-3 text-left shadow-sm min-w-40 max-w-52">
      <p className="font-semibold text-sm leading-tight">{no.nome}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{no.funcao}</p>
      <div className="mt-1.5">
        <Badge variant={SENIORIDADE_VARIANTE[no.senioridade] ?? "default"} className="text-[10px] px-1.5 py-0">
          {SENIORIDADE_LABELS[no.senioridade] ?? no.senioridade}
        </Badge>
      </div>
    </div>
  )
}

function NosColaborador({
  nos,
  TreeNode,
}: {
  nos: NoColaborador[]
  TreeNode: ComponentType<TreeNodeProps>
}) {
  return (
    <>
      {nos.map((no) => (
        <TreeNode key={no.id} label={<CartaoNo no={no} />}>
          {no.subordinados.length > 0 && (
            <NosColaborador nos={no.subordinados} TreeNode={TreeNode} />
          )}
        </TreeNode>
      ))}
    </>
  )
}

export function ArvoreOrganograma() {
  const [raizes, setRaizes] = useState<NoColaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [bib, setBib] = useState<BibTree | null>(null)

  useEffect(() => {
    // Importar a lib somente no browser — ela acessa `document` no load
    import("react-organizational-chart").then((mod) => {
      setBib({
        Tree: mod.Tree as ComponentType<TreeProps>,
        TreeNode: mod.TreeNode as ComponentType<TreeNodeProps>,
      })
    })
  }, [])

  useEffect(() => {
    async function buscar() {
      try {
        const resposta = await fetch("/api/organograma")
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.erro)
        setRaizes(dados.dados)
      } catch {
        setErro("Erro ao carregar organograma")
      } finally {
        setCarregando(false)
      }
    }
    buscar()
  }, [])

  if (carregando || !bib) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Carregando organograma...
      </div>
    )
  }

  if (erro) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {erro}
      </div>
    )
  }

  if (raizes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
        <GitBranch className="h-10 w-10 opacity-30" />
        <p>Nenhum colaborador ativo para exibir</p>
      </div>
    )
  }

  const { Tree, TreeNode } = bib
  const raizVirtual = raizes.length > 1

  return (
    <div className="overflow-auto pb-8">
      {raizVirtual ? (
        <Tree
          label={
            <div className="inline-block rounded-lg border bg-primary px-4 py-3 text-primary-foreground shadow-sm min-w-40">
              <p className="font-semibold text-sm">Time</p>
              <p className="text-xs opacity-70">{raizes.length} líderes</p>
            </div>
          }
          lineWidth="1.5px"
          lineColor="hsl(var(--border))"
          lineBorderRadius="6px"
          nodePadding="8px"
        >
          <NosColaborador nos={raizes} TreeNode={TreeNode} />
        </Tree>
      ) : (
        <Tree
          label={<CartaoNo no={raizes[0]} />}
          lineWidth="1.5px"
          lineColor="hsl(var(--border))"
          lineBorderRadius="6px"
          nodePadding="8px"
        >
          {raizes[0].subordinados.length > 0 && (
            <NosColaborador nos={raizes[0].subordinados} TreeNode={TreeNode} />
          )}
        </Tree>
      )}
    </div>
  )
}
