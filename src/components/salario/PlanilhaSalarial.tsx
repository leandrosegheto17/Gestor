"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Printer, FileSpreadsheet } from "lucide-react"
import { formatarMoeda } from "@/lib/utils"

interface ItemPlanilha {
  colaborador: {
    id: string
    nome: string
    funcao: string
    senioridade: string
    projeto: { id: string; nome: string } | null
  }
  movimentacao: {
    id: string
    salarioAtual: number
    fatorReajuste: number
    salarioProposto: number
    status: string
    cicloAno: number
    cicloMes: number
  } | null
}

interface Totais {
  totalAtual: number
  totalProposto: number
  diferenca: number
  percentualMedio: number
}

interface DadosPlanilha {
  itens: ItemPlanilha[]
  totais: Totais
  ciclosDisponiveis: { ano: number; mes: number }[]
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const SENIORIDADE_LABELS: Record<string, string> = {
  JUNIOR: "Júnior",
  PLENO: "Pleno",
  SENIOR: "Sênior",
  STAFF: "Staff",
  PRINCIPAL: "Principal",
}

const STATUS_VARIANTE: Record<string, "warning" | "info" | "success"> = {
  PENDENTE: "warning",
  APROVADA: "info",
  APLICADA: "success",
}

type AgrupamentoPor = "nenhum" | "projeto" | "senioridade"

function LinhaTotal({ label, totais }: { label?: string; totais: Totais }) {
  return (
    <TableRow className="border-t-2 bg-muted/30 font-bold">
      <TableCell colSpan={3} className="text-right text-sm">
        {label ?? "Total"}
      </TableCell>
      <TableCell className="text-right font-mono">{formatarMoeda(totais.totalAtual)}</TableCell>
      <TableCell />
      <TableCell className="text-right font-mono text-green-700">
        {formatarMoeda(totais.totalProposto)}
      </TableCell>
      <TableCell className="text-right font-mono text-green-700">
        +{formatarMoeda(totais.diferenca)}
      </TableCell>
      <TableCell className="text-right font-mono text-green-700">
        +{totais.percentualMedio.toFixed(1)}%
      </TableCell>
      <TableCell />
    </TableRow>
  )
}

function calcularTotaisGrupo(itens: ItemPlanilha[]): Totais {
  const comDados = itens.filter((i) => i.movimentacao !== null)
  const totalAtual = comDados.reduce((acc, i) => acc + (i.movimentacao?.salarioAtual ?? 0), 0)
  const totalProposto = comDados.reduce((acc, i) => acc + (i.movimentacao?.salarioProposto ?? 0), 0)
  const diferenca = totalProposto - totalAtual
  const percentualMedio = totalAtual > 0 ? (diferenca / totalAtual) * 100 : 0
  return { totalAtual, totalProposto, diferenca, percentualMedio }
}

export function PlanilhaSalarial() {
  const [dados, setDados] = useState<DadosPlanilha | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [cicloAno, setCicloAno] = useState("")
  const [cicloMes, setCicloMes] = useState("")
  const [agruparPor, setAgruparPor] = useState<AgrupamentoPor>("nenhum")

  useEffect(() => {
    buscarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cicloAno, cicloMes])

  async function buscarDados() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (cicloAno) params.set("cicloAno", cicloAno)
      if (cicloMes) params.set("cicloMes", cicloMes)

      const r = await fetch(`/api/salario/planilha?${params}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      setDados(d.dados)

      // Pré-selecionar o ciclo mais recente se nenhum estiver selecionado
      if (!cicloAno && d.dados.ciclosDisponiveis.length > 0) {
        const mais_recente = d.dados.ciclosDisponiveis[0]
        setCicloAno(String(mais_recente.ano))
        setCicloMes(String(mais_recente.mes))
      }
    } catch {
      setErro("Erro ao carregar planilha salarial")
    } finally {
      setCarregando(false)
    }
  }

  function renderLinhas(itens: ItemPlanilha[]) {
    return itens.map((item) => {
      const mov = item.movimentacao
      const diferenca = mov ? mov.salarioProposto - mov.salarioAtual : null
      const percentual = mov && mov.salarioAtual > 0
        ? ((mov.salarioProposto - mov.salarioAtual) / mov.salarioAtual) * 100
        : null

      return (
        <TableRow key={item.colaborador.id}>
          <TableCell className="font-medium">{item.colaborador.nome}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{item.colaborador.funcao}</TableCell>
          <TableCell>
            <span className="text-xs text-muted-foreground">
              {SENIORIDADE_LABELS[item.colaborador.senioridade] ?? item.colaborador.senioridade}
            </span>
          </TableCell>
          <TableCell className="text-right font-mono text-sm">
            {mov ? formatarMoeda(mov.salarioAtual) : <span className="text-muted-foreground">—</span>}
          </TableCell>
          <TableCell className="text-center font-mono text-sm">
            {mov ? (
              <span className="text-green-700 font-medium">+{mov.fatorReajuste.toFixed(1)}%</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
          <TableCell className="text-right font-mono text-sm font-medium">
            {mov ? formatarMoeda(mov.salarioProposto) : <span className="text-muted-foreground">—</span>}
          </TableCell>
          <TableCell className="text-right font-mono text-sm text-green-700">
            {diferenca !== null ? `+${formatarMoeda(diferenca)}` : <span className="text-muted-foreground">—</span>}
          </TableCell>
          <TableCell className="text-right font-mono text-sm text-green-700">
            {percentual !== null ? `+${percentual.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}
          </TableCell>
          <TableCell>
            {mov ? (
              <Badge variant={STATUS_VARIANTE[mov.status] ?? "secondary"} className="text-xs">
                {mov.status === "PENDENTE" ? "Pendente" : mov.status === "APROVADA" ? "Aprovada" : "Aplicada"}
              </Badge>
            ) : null}
          </TableCell>
        </TableRow>
      )
    })
  }

  function renderAgrupado() {
    if (!dados) return null

    if (agruparPor === "nenhum") {
      return (
        <>
          {renderLinhas(dados.itens)}
          <LinhaTotal totais={dados.totais} />
        </>
      )
    }

    if (agruparPor === "projeto") {
      const grupos = new Map<string, ItemPlanilha[]>()
      for (const item of dados.itens) {
        const chave = item.colaborador.projeto?.nome ?? "Sem projeto"
        if (!grupos.has(chave)) grupos.set(chave, [])
        grupos.get(chave)!.push(item)
      }

      return (
        <>
          {Array.from(grupos.entries()).map(([grupo, itens]) => (
            <>
              <TableRow key={`header-${grupo}`} className="bg-muted/20">
                <TableCell colSpan={9} className="py-2 font-semibold text-sm">
                  {grupo}
                </TableCell>
              </TableRow>
              {renderLinhas(itens)}
              <LinhaTotal label={`Subtotal — ${grupo}`} totais={calcularTotaisGrupo(itens)} />
            </>
          ))}
        </>
      )
    }

    if (agruparPor === "senioridade") {
      const ordem = ["PRINCIPAL", "STAFF", "SENIOR", "PLENO", "JUNIOR"]
      const grupos = new Map<string, ItemPlanilha[]>()
      for (const s of ordem) grupos.set(s, [])
      for (const item of dados.itens) {
        const chave = item.colaborador.senioridade
        if (!grupos.has(chave)) grupos.set(chave, [])
        grupos.get(chave)!.push(item)
      }

      return (
        <>
          {Array.from(grupos.entries())
            .filter(([, itens]) => itens.length > 0)
            .map(([grupo, itens]) => (
              <>
                <TableRow key={`header-${grupo}`} className="bg-muted/20">
                  <TableCell colSpan={9} className="py-2 font-semibold text-sm">
                    {SENIORIDADE_LABELS[grupo] ?? grupo}
                  </TableCell>
                </TableRow>
                {renderLinhas(itens)}
                <LinhaTotal
                  label={`Subtotal — ${SENIORIDADE_LABELS[grupo] ?? grupo}`}
                  totais={calcularTotaisGrupo(itens)}
                />
              </>
            ))}
        </>
      )
    }
  }

  const cicloLabel =
    cicloAno && cicloMes
      ? `${MESES[Number(cicloMes) - 1]} / ${cicloAno}`
      : "Mais recente"

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="no-print flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Ciclo:</span>
          <Select
            value={cicloAno}
            onChange={(e) => setCicloAno(e.target.value)}
            className="w-24"
          >
            <option value="">—</option>
            {dados?.ciclosDisponiveis.map((c) => (
              <option key={c.ano} value={c.ano}>{c.ano}</option>
            ))}
          </Select>
          <Select
            value={cicloMes}
            onChange={(e) => setCicloMes(e.target.value)}
            className="w-36"
          >
            <option value="">—</option>
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Agrupar por:</span>
          {(["nenhum", "projeto", "senioridade"] as AgrupamentoPor[]).map((op) => (
            <button
              key={op}
              onClick={() => setAgruparPor(op)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                agruparPor === op
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-accent"
              }`}
            >
              {op === "nenhum" ? "Nenhum" : op === "projeto" ? "Projeto" : "Senioridade"}
            </button>
          ))}
        </div>

        <Button variant="outline" onClick={() => window.print()} className="ml-auto gap-2">
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </Button>
      </div>

      {/* Cabeçalho imprimível */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold">Planilha Salarial — {cicloLabel}</h2>
        <p className="text-sm text-gray-500">Gestor de Times</p>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {carregando ? (
        <div className="py-12 text-center text-muted-foreground">Carregando planilha...</div>
      ) : !dados || dados.itens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <FileSpreadsheet className="h-10 w-10 opacity-30" />
          <p>Nenhum dado disponível para o ciclo selecionado</p>
        </div>
      ) : (
        <>
          {/* Cards de totais */}
          <div className="no-print grid gap-3 sm:grid-cols-4">
            {[
              {
                label: "Custo Atual Total",
                valor: formatarMoeda(dados.totais.totalAtual),
                cor: "text-foreground",
              },
              {
                label: "Custo Proposto Total",
                valor: formatarMoeda(dados.totais.totalProposto),
                cor: "text-green-700",
              },
              {
                label: "Impacto Total",
                valor: `+${formatarMoeda(dados.totais.diferenca)}`,
                cor: "text-green-700",
              },
              {
                label: "Reajuste Médio",
                valor: `+${dados.totais.percentualMedio.toFixed(1)}%`,
                cor: "text-green-700",
              },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`mt-1 text-lg font-bold font-mono ${card.cor}`}>{card.valor}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Senioridade</TableHead>
                  <TableHead className="text-right">Sal. Atual</TableHead>
                  <TableHead className="text-center">Reajuste</TableHead>
                  <TableHead className="text-right">Sal. Proposto</TableHead>
                  <TableHead className="text-right">Dif. R$</TableHead>
                  <TableHead className="text-right">Dif. %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderAgrupado()}</TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
