"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts"
import { Award, TrendingUp, TrendingDown, Users, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { classificarPontuacao } from "@/lib/pontuacao"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ItemRanking {
  id: string
  nome: string
  funcao: string
  senioridade: string
  projeto: { id: string; nome: string } | null
  pontuacaoTotal: number
  pontosFeedback: number
  pontosOcorrencia: number
  totalFeedbacks: number
  totalOcorrencias: number
  feedbacksPositivos: number
  feedbacksConstrutivos: number
}

interface Resumo {
  totalColaboradores: number
  mediaPontuacao: number
  melhorPontuacao: number
  piorPontuacao: number
  acimaDaMedia: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SENIORIDADE_LABEL: Record<string, string> = {
  JUNIOR: "Júnior", PLENO: "Pleno", SENIOR: "Sênior", STAFF: "Staff", PRINCIPAL: "Principal",
}

const SENIORIDADE_VARIANTE: Record<string, "info" | "success" | "warning" | "purple" | "default"> = {
  JUNIOR: "info", PLENO: "success", SENIOR: "warning", STAFF: "purple", PRINCIPAL: "default",
}

function medalha(posicao: number) {
  if (posicao === 1) return "🥇"
  if (posicao === 2) return "🥈"
  if (posicao === 3) return "🥉"
  return null
}

function TooltipGrafico({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1 max-w-32 truncate">{label}</p>
      <p>Pontuação: <span className="font-bold">{payload[0].value}</span></p>
    </div>
  )
}

// ─── Barra visual de pontuação ────────────────────────────────────────────────

function BarraPontuacao({ valor, max }: { valor: number; max: number }) {
  const absMax = Math.max(Math.abs(max), 1)
  const pct = Math.min(Math.abs(valor) / absMax, 1) * 100
  const positivo = valor >= 0
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${positivo ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-12 text-right tabular-nums ${positivo ? "text-green-700" : "text-red-600"}`}>
        {valor > 0 ? "+" : ""}{valor}
      </span>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RankingDesempenho() {
  const [itens, setItens] = useState<ItemRanking[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/desempenho")
      .then((r) => r.json())
      .then((j) => {
        setItens(j.dados.itens)
        setResumo(j.dados.resumo)
      })
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    )
  }

  const itensFiltrados = itens.filter((i) =>
    i.nome.toLowerCase().includes(busca.toLowerCase()) ||
    i.projeto?.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const maxPontuacao = itens.length > 0 ? Math.max(...itens.map((i) => Math.abs(i.pontuacaoTotal))) : 1
  const top10Grafico = itens.slice(0, 10).map((i) => ({
    nome: i.nome.split(" ")[0],
    pontuacao: i.pontuacaoTotal,
  }))

  return (
    <div className="space-y-6">
      {/* ── Cards resumo ── */}
      {resumo && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumo.totalColaboradores}</p>
              <p className="text-xs text-muted-foreground">{resumo.acimaDaMedia} acima da média</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Award className="h-4 w-4" />Média geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumo.mediaPontuacao > 0 ? "+" : ""}{resumo.mediaPontuacao}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />Melhor pontuação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">+{resumo.melhorPontuacao}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingDown className="h-4 w-4" />Menor pontuação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{resumo.piorPontuacao}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Gráfico top 10 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Top 10 — Pontuação por colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top10Grafico} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Tooltip content={<TooltipGrafico />} />
              <Bar dataKey="pontuacao" radius={[4, 4, 0, 0]}>
                {top10Grafico.map((entry, i) => (
                  <Cell key={i} fill={entry.pontuacao >= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Filtro ── */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filtrar por nome ou projeto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="text-sm text-muted-foreground">{itensFiltrados.length} colaboradores</span>
      </div>

      {/* ── Tabela de ranking ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">Colaborador</th>
                  <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground">Feedbacks</th>
                  <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground">Ocorrências</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground min-w-48">Pontuação</th>
                  <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground">Nível</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((item, idx) => {
                  const posicao = itens.indexOf(item) + 1
                  const faixa = classificarPontuacao(item.pontuacaoTotal)
                  const med = medalha(posicao)
                  return (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => router.push(`/desempenho/${item.id}`)}
                    >
                      <td className="py-3 px-3 text-sm font-medium text-muted-foreground">
                        {med ? <span className="text-base">{med}</span> : posicao}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-sm">{item.nome}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={SENIORIDADE_VARIANTE[item.senioridade] ?? "default"} className="text-[10px] px-1 py-0">
                            {SENIORIDADE_LABEL[item.senioridade] ?? item.senioridade}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{item.funcao}</span>
                          {item.projeto && (
                            <span className="text-[11px] text-muted-foreground">· {item.projeto.nome}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <p className="text-sm">{item.totalFeedbacks}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.feedbacksPositivos}✓ {item.feedbacksConstrutivos}✗
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center text-sm">{item.totalOcorrencias}</td>
                      <td className="py-3 px-3">
                        <BarraPontuacao valor={item.pontuacaoTotal} max={maxPontuacao} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${faixa.cor} ${faixa.corFundo} ${faixa.corBorda}`}>
                          {faixa.rotulo}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
