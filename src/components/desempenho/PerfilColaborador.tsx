"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts"
import {
  ArrowLeft, Printer, TrendingUp, MessageSquare, AlertTriangle,
  User, Briefcase, Calendar, Star,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { classificarPontuacao, PONTOS_FEEDBACK } from "@/lib/pontuacao"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id: string
  data: string
  tipo: string
  fonte: string
  descricao: string
  pontos: number
}

interface OcorrenciaItem {
  id: string
  data: string
  tipo: string
  gravidade: number
  descricao: string
  pontos: number
}

interface EvolucaoMes {
  chave: string
  rotulo: string
  pontosMes: number
  acumulado: number
}

interface Breakdown {
  feedbacksPositivos: number
  feedbacksConstrutivos: number
  feedbacksNeutros: number
  ocorrenciasPositivas: number
  ocorrenciasNegativas: number
}

interface ColaboradorInfo {
  id: string
  nome: string
  funcao: string
  senioridade: string
  projeto: { nome: string; tecnologia: string } | null
  lider: { nome: string; funcao: string } | null
  criadoEm: string
}

interface DadosPerfil {
  colaborador: ColaboradorInfo
  pontuacaoTotal: number
  pontosFeedback: number
  pontosOcorrencia: number
  feedbacks: FeedbackItem[]
  ocorrencias: OcorrenciaItem[]
  evolucaoMensal: EvolucaoMes[]
  breakdown: Breakdown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SENIORIDADE_LABEL: Record<string, string> = {
  JUNIOR: "Júnior", PLENO: "Pleno", SENIOR: "Sênior", STAFF: "Staff", PRINCIPAL: "Principal",
}

const FONTE_LABEL: Record<string, string> = {
  GESTOR: "Gestor", LIDER_DIRETO: "Líder direto", COLEGA: "Colega", CLIENTE: "Cliente",
}

const TIPO_FEEDBACK_LABEL: Record<string, string> = {
  POSITIVO: "Positivo", CONSTRUTIVO: "Construtivo", NEUTRO: "Neutro",
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function TooltipEvolucao({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={p.value >= 0 ? "text-green-600" : "text-red-600"}>
          {p.name === "pontosMes" ? "No mês" : "Acumulado"}: {p.value > 0 ? "+" : ""}{p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Card de estatística ──────────────────────────────────────────────────────

function StatCard({ icone: Icone, titulo, valor, sub, cor }: {
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  valor: React.ReactNode
  sub?: string
  cor?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icone className="h-4 w-4" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${cor ?? ""}`}>{valor}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Linha de feedback ────────────────────────────────────────────────────────

function LinhaFeedback({ f }: { f: FeedbackItem }) {
  const positivo = f.tipo === "POSITIVO"
  const neutro   = f.tipo === "NEUTRO"
  return (
    <div className={`rounded-lg border p-3 text-sm ${positivo ? "bg-green-50 border-green-200" : neutro ? "bg-muted/40 border-border" : "bg-orange-50 border-orange-200"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${positivo ? "text-green-700" : neutro ? "text-muted-foreground" : "text-orange-700"}`}>
            {TIPO_FEEDBACK_LABEL[f.tipo]}
          </span>
          <span className="text-xs text-muted-foreground">via {FONTE_LABEL[f.fonte]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tabular-nums ${f.pontos > 0 ? "text-green-600" : f.pontos < 0 ? "text-red-600" : "text-muted-foreground"}`}>
            {f.pontos > 0 ? "+" : ""}{f.pontos} pts
          </span>
          <span className="text-xs text-muted-foreground">{formatarData(f.data)}</span>
        </div>
      </div>
      <p className="text-muted-foreground leading-snug">{f.descricao}</p>
    </div>
  )
}

// ─── Linha de ocorrência ──────────────────────────────────────────────────────

function LinhaOcorrencia({ o }: { o: OcorrenciaItem }) {
  const positivo = o.tipo === "POSITIVA"
  const gravBullets = Array.from({ length: 5 }, (_, i) => i < o.gravidade)
  return (
    <div className={`rounded-lg border p-3 text-sm ${positivo ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${positivo ? "text-green-700" : "text-red-700"}`}>
            {positivo ? "Positiva" : "Negativa"}
          </span>
          <span className="flex gap-0.5">
            {gravBullets.map((ativo, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${ativo ? (positivo ? "bg-green-500" : "bg-red-500") : "bg-muted"}`} />
            ))}
          </span>
          <span className="text-xs text-muted-foreground">gravidade {o.gravidade}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tabular-nums ${o.pontos > 0 ? "text-green-600" : "text-red-600"}`}>
            {o.pontos > 0 ? "+" : ""}{o.pontos} pts
          </span>
          <span className="text-xs text-muted-foreground">{formatarData(o.data)}</span>
        </div>
      </div>
      <p className="text-muted-foreground leading-snug">{o.descricao}</p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PerfilColaborador({ id }: { id: string }) {
  const [dados, setDados] = useState<DadosPerfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/desempenho/${id}`)
      .then((r) => r.json())
      .then((j) => setDados(j.dados))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [id])

  if (carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Colaborador não encontrado.
      </div>
    )
  }

  const { colaborador: c, pontuacaoTotal, pontosFeedback, pontosOcorrencia, feedbacks, ocorrencias, evolucaoMensal, breakdown } = dados
  const faixa = classificarPontuacao(pontuacaoTotal)

  const feedbacksPositivos    = feedbacks.filter((f) => f.tipo === "POSITIVO")
  const feedbacksConstrutivos = feedbacks.filter((f) => f.tipo === "CONSTRUTIVO")
  const ocorrenciasPositivas  = ocorrencias.filter((o) => o.tipo === "POSITIVA")
  const ocorrenciasNegativas  = ocorrencias.filter((o) => o.tipo === "NEGATIVA")

  const dataIngresso = new Date(c.criadoEm).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* ── Barra de navegação (oculta na impressão) ── */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push("/desempenho")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Ranking
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Apresentar
        </button>
      </div>

      {/* ── Cabeçalho do colaborador ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold border-2 ${faixa.corFundo} ${faixa.corBorda} ${faixa.cor}`}>
                {c.nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </div>
              <div>
                <h2 className="text-xl font-bold">{c.nome}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={({ JUNIOR: "info", PLENO: "success", SENIOR: "warning", STAFF: "purple", PRINCIPAL: "default" } as Record<string, "info" | "success" | "warning" | "purple" | "default">)[c.senioridade] ?? "default"}>
                    {SENIORIDADE_LABEL[c.senioridade] ?? c.senioridade}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />{c.funcao}
                  </span>
                  {c.projeto && (
                    <span className="text-sm text-muted-foreground">· {c.projeto.nome}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  {c.lider && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />Líder: {c.lider.nome}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Desde {dataIngresso}
                  </span>
                </div>
              </div>
            </div>
            <div className={`flex flex-col items-center justify-center rounded-xl border-2 px-6 py-3 ${faixa.corFundo} ${faixa.corBorda}`}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</span>
              <span className={`text-3xl font-bold tabular-nums ${faixa.cor}`}>
                {pontuacaoTotal > 0 ? "+" : ""}{pontuacaoTotal}
              </span>
              <span className={`text-xs font-semibold mt-0.5 ${faixa.cor}`}>{faixa.rotulo}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cards de estatísticas ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icone={MessageSquare}
          titulo="Feedbacks"
          valor={feedbacks.length}
          sub={`${breakdown.feedbacksPositivos} positivos · ${breakdown.feedbacksConstrutivos} construtivos`}
          cor={pontosFeedback >= 0 ? "text-green-600" : "text-red-600"}
        />
        <StatCard
          icone={AlertTriangle}
          titulo="Ocorrências"
          valor={ocorrencias.length}
          sub={`${breakdown.ocorrenciasPositivas} positivas · ${breakdown.ocorrenciasNegativas} negativas`}
        />
        <StatCard
          icone={TrendingUp}
          titulo="Pts via feedbacks"
          valor={<span className={pontosFeedback >= 0 ? "text-green-600" : "text-red-600"}>{pontosFeedback > 0 ? "+" : ""}{pontosFeedback}</span>}
          sub="soma de todas as fontes"
        />
        <StatCard
          icone={Star}
          titulo="Pts via ocorrências"
          valor={<span className={pontosOcorrencia >= 0 ? "text-green-600" : "text-red-600"}>{pontosOcorrencia > 0 ? "+" : ""}{pontosOcorrencia}</span>}
          sub="proporcional à gravidade"
        />
      </div>

      {/* ── Gráfico de evolução ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução da pontuação — últimos 12 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolucaoMensal} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
              <Tooltip content={<TooltipEvolucao />} />
              <Area
                type="monotone"
                dataKey="acumulado"
                stroke="#60a5fa"
                fill="url(#gradAcumulado)"
                strokeWidth={2}
                dot={{ r: 3, fill: "#60a5fa" }}
                name="acumulado"
              />
              <Line
                type="monotone"
                dataKey="pontosMes"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="pontosMes"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block" />Pontuação acumulada</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-400 inline-block border-t border-dashed border-slate-400" />Pontos no mês</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Feedbacks ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs">✓</span>
            Feedbacks positivos ({feedbacksPositivos.length})
          </h3>
          {feedbacksPositivos.length === 0
            ? <p className="text-sm text-muted-foreground rounded-lg border p-3">Nenhum feedback positivo registrado.</p>
            : feedbacksPositivos.map((f) => <LinhaFeedback key={f.id} f={f} />)
          }
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs">!</span>
            Feedbacks construtivos ({feedbacksConstrutivos.length})
          </h3>
          {feedbacksConstrutivos.length === 0
            ? <p className="text-sm text-muted-foreground rounded-lg border p-3">Nenhum feedback construtivo registrado.</p>
            : feedbacksConstrutivos.map((f) => <LinhaFeedback key={f.id} f={f} />)
          }
        </div>
      </div>

      {/* ── Ocorrências ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs">★</span>
            Ocorrências positivas ({ocorrenciasPositivas.length})
          </h3>
          {ocorrenciasPositivas.length === 0
            ? <p className="text-sm text-muted-foreground rounded-lg border p-3">Nenhuma ocorrência positiva registrada.</p>
            : ocorrenciasPositivas.map((o) => <LinhaOcorrencia key={o.id} o={o} />)
          }
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs">✗</span>
            Ocorrências negativas ({ocorrenciasNegativas.length})
          </h3>
          {ocorrenciasNegativas.length === 0
            ? <p className="text-sm text-muted-foreground rounded-lg border p-3">Nenhuma ocorrência negativa registrada.</p>
            : ocorrenciasNegativas.map((o) => <LinhaOcorrencia key={o.id} o={o} />)
          }
        </div>
      </div>

      {/* ── Tabela de pontos por fonte (resumo) ── */}
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle className="text-sm">Tabela de pontos aplicada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Feedback positivo</p>
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(PONTOS_FEEDBACK.POSITIVO).map(([fonte, pts]) => (
                    <tr key={fonte} className="border-b last:border-0">
                      <td className="py-1 text-muted-foreground">{FONTE_LABEL[fonte]}</td>
                      <td className="py-1 text-right font-bold text-green-600">+{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Feedback construtivo</p>
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(PONTOS_FEEDBACK.CONSTRUTIVO).map(([fonte, pts]) => (
                    <tr key={fonte} className="border-b last:border-0">
                      <td className="py-1 text-muted-foreground">{FONTE_LABEL[fonte]}</td>
                      <td className="py-1 text-right font-bold text-red-600">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ocorrências: POSITIVA = +gravidade pts · NEGATIVA = −gravidade pts (escala 1–5)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
