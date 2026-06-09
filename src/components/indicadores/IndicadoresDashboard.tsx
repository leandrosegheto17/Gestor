"use client"

import { useState, useEffect, useCallback } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts"
import { AlertTriangle, Users, Briefcase, MessageSquare, AlertCircle, CalendarDays, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatarData } from "@/lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ItemGrafico {
  nome: string
  total: number
}

interface FeedbackMes {
  mes: string
  total: number
  POSITIVO: number
  CONSTRUTIVO: number
  NEUTRO: number
}

interface OcorrenciaMes {
  mes: string
  POSITIVA: number
  NEGATIVA: number
}

interface AlertaFerias {
  id: string
  nome: string
  dataInicio: string
  dataFim: string
  diasRestantes: number
}

interface AlertaSemFeedback {
  id: string
  nome: string
  funcao: string
}

interface DadosIndicadores {
  resumo: {
    totalAtivos: number
    totalProjetos: number
    totalFeedbacksNoPeriodo: number
    totalOcorrenciasNoPeriodo: number
  }
  distribuicaoSenioridade: ItemGrafico[]
  distribuicaoProjeto: ItemGrafico[]
  feedbacksPorMes: FeedbackMes[]
  ocorrenciasPorMes: OcorrenciaMes[]
  alertasFerias: AlertaFerias[]
  alertasSemFeedback: AlertaSemFeedback[]
}

// ─── Paletas de cores ─────────────────────────────────────────────────────────

const CORES_SENIORIDADE = ["#60a5fa", "#4ade80", "#facc15", "#c084fc", "#f97316"]
const COR_PROJETO = "#3b82f6"
const COR_POSITIVO = "#22c55e"
const COR_CONSTRUTIVO = "#f97316"
const COR_NEUTRO = "#94a3b8"
const COR_POSITIVA = "#22c55e"
const COR_NEGATIVA = "#ef4444"

// ─── Tooltip personalizado ────────────────────────────────────────────────────

function TooltipPersonalizado({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-md text-xs backdrop-blur-sm">
      {label && <p className="font-semibold mb-1.5 text-sm">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Card de resumo ───────────────────────────────────────────────────────────

function CardResumo({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  corIcone,
}: {
  titulo: string
  valor: number
  subtitulo?: string
  icone: React.ElementType
  corIcone: string
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
          <p className="text-3xl font-bold mt-1">{valor.toLocaleString("pt-BR")}</p>
          {subtitulo && <p className="text-xs text-muted-foreground mt-1">{subtitulo}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${corIcone}`}>
          <Icone className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ─── Card de gráfico ──────────────────────────────────────────────────────────

function CardGrafico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="font-semibold mb-4 text-sm">{titulo}</h3>
      {children}
    </div>
  )
}

// ─── Estado vazio do gráfico ──────────────────────────────────────────────────

function SemDados() {
  return (
    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
      Nenhum dado no período selecionado
    </div>
  )
}

// ─── Esqueleto de carregamento ────────────────────────────────────────────────

function Esqueleto() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 h-28" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 h-80" />
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function IndicadoresDashboard() {
  const [periodo, setPeriodo] = useState(6)
  const [dados, setDados] = useState<DadosIndicadores | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")

  const buscarDados = useCallback(async () => {
    setCarregando(true)
    setErro("")
    try {
      const res = await fetch(`/api/indicadores?periodoMeses=${periodo}`)
      if (!res.ok) throw new Error("Falha ao carregar indicadores")
      const json = await res.json()
      setDados(json.dados)
    } catch {
      setErro("Não foi possível carregar os indicadores. Tente novamente.")
    } finally {
      setCarregando(false)
    }
  }, [periodo])

  useEffect(() => {
    buscarDados()
  }, [buscarDados])

  if (carregando) return <Esqueleto />

  if (erro) {
    return (
      <div className="rounded-xl border bg-destructive/10 p-6 text-destructive text-sm">
        {erro}
      </div>
    )
  }

  if (!dados) return null

  const { resumo, distribuicaoSenioridade, distribuicaoProjeto, feedbacksPorMes, ocorrenciasPorMes, alertasFerias, alertasSemFeedback } = dados

  const periodos = [
    { valor: 3, rotulo: "3 meses" },
    { valor: 6, rotulo: "6 meses" },
    { valor: 12, rotulo: "12 meses" },
  ]

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        <div className="flex gap-1">
          {periodos.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPeriodo(p.valor)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                periodo === p.valor
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          titulo="Colaboradores Ativos"
          valor={resumo.totalAtivos}
          icone={Users}
          corIcone="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
        />
        <CardResumo
          titulo="Projetos"
          valor={resumo.totalProjetos}
          icone={Briefcase}
          corIcone="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
        />
        <CardResumo
          titulo="Feedbacks no Período"
          valor={resumo.totalFeedbacksNoPeriodo}
          subtitulo={`Últimos ${periodo} meses`}
          icone={MessageSquare}
          corIcone="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
        />
        <CardResumo
          titulo="Ocorrências no Período"
          valor={resumo.totalOcorrenciasNoPeriodo}
          subtitulo={`Últimos ${periodo} meses`}
          icone={TrendingUp}
          corIcone="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Donut: Senioridade */}
        <CardGrafico titulo="Distribuição por Senioridade">
          {distribuicaoSenioridade.length === 0 ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribuicaoSenioridade}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="nome"
                >
                  {distribuicaoSenioridade.map((_, i) => (
                    <Cell key={i} fill={CORES_SENIORIDADE[i % CORES_SENIORIDADE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPersonalizado />} />
                <Legend
                  formatter={(value) => <span className="text-xs">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>

        {/* Barras horizontais: Por projeto */}
        <CardGrafico titulo="Colaboradores por Projeto">
          {distribuicaoProjeto.length === 0 ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={distribuicaoProjeto}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={110}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="total" name="Colaboradores" fill={COR_PROJETO} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>

        {/* Linha: Feedbacks ao longo do tempo */}
        <CardGrafico titulo="Feedbacks ao Longo do Tempo">
          {feedbacksPorMes.every((f) => f.total === 0) ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={feedbacksPorMes} margin={{ top: 8, right: 16, left: 0, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-40}
                  textAnchor="end"
                  interval={periodo > 6 ? 1 : 0}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipPersonalizado />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 8 }}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="POSITIVO"
                  name="Positivo"
                  stroke={COR_POSITIVO}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="CONSTRUTIVO"
                  name="Construtivo"
                  stroke={COR_CONSTRUTIVO}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="NEUTRO"
                  name="Neutro"
                  stroke={COR_NEUTRO}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>

        {/* Barras agrupadas: Ocorrências por tipo */}
        <CardGrafico titulo="Ocorrências por Tipo">
          {ocorrenciasPorMes.every((o) => o.POSITIVA === 0 && o.NEGATIVA === 0) ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ocorrenciasPorMes} margin={{ top: 8, right: 16, left: 0, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-40}
                  textAnchor="end"
                  interval={periodo > 6 ? 1 : 0}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "hsl(var(--muted))" }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 8 }}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="POSITIVA" name="Positiva" fill={COR_POSITIVA} radius={[4, 4, 0, 0]} />
                <Bar dataKey="NEGATIVA" name="Negativa" fill={COR_NEGATIVA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Férias nos próximos 30 dias */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-sm">Férias nos Próximos 30 Dias</h3>
            {alertasFerias.length > 0 && (
              <Badge variant="warning">{alertasFerias.length}</Badge>
            )}
          </div>
          {alertasFerias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma férias agendada para os próximos 30 dias.</p>
          ) : (
            <ul className="space-y-2">
              {alertasFerias.map((a, i) => (
                <li
                  key={`${a.id}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{a.nome}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {formatarData(a.dataInicio)} → {formatarData(a.dataFim)}
                    </span>
                  </div>
                  <Badge variant="warning" className="flex-shrink-0">
                    {a.diasRestantes === 0 ? "Hoje" : `em ${a.diasRestantes}d`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sem feedback nos últimos 90 dias */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-sm">Sem Feedback nos Últimos 90 Dias</h3>
            {alertasSemFeedback.length > 0 && (
              <Badge variant="secondary">{alertasSemFeedback.length}</Badge>
            )}
          </div>
          {alertasSemFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os colaboradores receberam feedback recentemente.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {alertasSemFeedback.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{a.nome}</span>
                  <span className="text-xs text-muted-foreground">{a.funcao}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Alertas gerais */}
      {(alertasFerias.length > 0 || alertasSemFeedback.length > 0) && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            {[
              alertasFerias.length > 0 && `${alertasFerias.length} colaborador${alertasFerias.length > 1 ? "es entrarão" : " entrará"} de férias nos próximos 30 dias`,
              alertasSemFeedback.length > 0 && `${alertasSemFeedback.length} colaborador${alertasSemFeedback.length > 1 ? "es" : ""} sem feedback nos últimos 90 dias`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
    </div>
  )
}
