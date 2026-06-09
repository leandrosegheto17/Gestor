"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import { Users, DollarSign, TrendingUp, Calculator, ChevronDown, ChevronRight, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface SenioridadeItem {
  senioridade: string
  count: number
  folhaBruta: number
  encargos: number
  beneficios: number
  custoTotal: number
}

interface ProjetoCusto {
  id: string
  nome: string
  tecnologia: string
  headcount: number
  folhaBruta: number
  encargos: number
  beneficios: number
  custoTotal: number
  percentualDoTotal: number
  porSenioridade: SenioridadeItem[]
}

interface Resumo {
  totalColaboradores: number
  totalFolhaBruta: number
  totalEncargos: number
  totalBeneficios: number
  totalCustoEmpresa: number
  custoMedioPorPessoa: number
}

interface EncargosDetalhamento {
  inssPatronal: number
  fgts: number
  decimoTerceiro: number
  feriasMaisAdicional: number
  sistemaS: number
  rat: number
  valeRefeicao: number
  valeTransporte: number
  planoSaude: number
}

interface PercentuaisEncargos {
  inssPatronal: number
  fgts: number
  decimoTerceiro: number
  feriasMaisAdicional: number
  sistemaS: number
  rat: number
  totalSobreFolha: number
}

interface BeneficiosFixos {
  valeRefeicao: number
  valeTransporte: number
  planoSaude: number
  totalPorPessoa: number
}

interface DadosCustos {
  resumo: Resumo
  projetos: ProjetoCusto[]
  encargosDetalhamento: EncargosDetalhamento
  percentuaisEncargos: PercentuaisEncargos
  beneficiosFixos: BeneficiosFixos
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const fmtPct = (n: number) => `${n.toFixed(1)}%`

const SENIORIDADE_LABEL: Record<string, string> = {
  JUNIOR: "Júnior", PLENO: "Pleno", SENIOR: "Sênior", STAFF: "Staff", PRINCIPAL: "Principal",
}
const SENIORIDADE_VARIANTE: Record<string, "info" | "success" | "warning" | "purple" | "default"> = {
  JUNIOR: "info", PLENO: "success", SENIOR: "warning", STAFF: "purple", PRINCIPAL: "default",
}

const CORES_PROJETOS = ["#60a5fa", "#4ade80", "#facc15", "#c084fc", "#f97316"]

// ─── Tooltip customizado ─────────────────────────────────────────────────────

function TooltipGrafico({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt.format(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Linha de detalhe por senioridade ────────────────────────────────────────

function LinhaSenioridade({ item }: { item: SenioridadeItem }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pl-8 pr-3">
        <Badge variant={SENIORIDADE_VARIANTE[item.senioridade] ?? "default"} className="text-[10px]">
          {SENIORIDADE_LABEL[item.senioridade] ?? item.senioridade}
        </Badge>
      </td>
      <td className="py-2 px-3 text-center text-sm">{item.count}</td>
      <td className="py-2 px-3 text-right text-sm">{fmt.format(item.folhaBruta)}</td>
      <td className="py-2 px-3 text-right text-sm text-muted-foreground">{fmt.format(item.encargos)}</td>
      <td className="py-2 px-3 text-right text-sm text-muted-foreground">{fmt.format(item.beneficios)}</td>
      <td className="py-2 px-3 text-right text-sm font-medium">{fmt.format(item.custoTotal)}</td>
    </tr>
  )
}

// ─── Linha do projeto (expansível) ───────────────────────────────────────────

function LinhaProjetoExpansivel({
  projeto,
  cor,
  totalCusto,
}: {
  projeto: ProjetoCusto
  cor: string
  totalCusto: number
}) {
  const [expandido, setExpandido] = useState(false)
  const pct = totalCusto > 0 ? (projeto.custoTotal / totalCusto) * 100 : 0

  return (
    <>
      <tr
        className="border-b hover:bg-muted/40 cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        <td className="py-3 pl-3 pr-3">
          <div className="flex items-center gap-2">
            {expandido ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cor }} />
            <span className="font-medium text-sm">{projeto.nome}</span>
          </div>
          <p className="text-[10px] text-muted-foreground ml-8">{projeto.tecnologia}</p>
        </td>
        <td className="py-3 px-3 text-center text-sm">{projeto.headcount}</td>
        <td className="py-3 px-3 text-right text-sm">{fmt.format(projeto.folhaBruta)}</td>
        <td className="py-3 px-3 text-right text-sm text-muted-foreground">{fmt.format(projeto.encargos)}</td>
        <td className="py-3 px-3 text-right text-sm text-muted-foreground">{fmt.format(projeto.beneficios)}</td>
        <td className="py-3 px-3 text-right">
          <p className="text-sm font-semibold">{fmt.format(projeto.custoTotal)}</p>
          <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">{fmtPct(pct)}</p>
        </td>
      </tr>
      {expandido &&
        projeto.porSenioridade.map((s) => (
          <LinhaSenioridade key={s.senioridade} item={s} />
        ))}
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CustoPorProjeto() {
  const [dados, setDados] = useState<DadosCustos | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [mostrarEncargos, setMostrarEncargos] = useState(false)

  useEffect(() => {
    fetch("/api/salario/custos")
      .then((r) => r.json())
      .then((j) => setDados(j.dados))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!dados || dados.projetos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
        <DollarSign className="h-10 w-10 opacity-30" />
        <p>Nenhum dado de salário encontrado. Registre movimentações salariais primeiro.</p>
      </div>
    )
  }

  const { resumo, projetos, encargosDetalhamento, percentuaisEncargos, beneficiosFixos } = dados

  const dadosGrafico = projetos.map((p) => ({
    nome: p.nome,
    "Folha bruta": Math.round(p.folhaBruta),
    "Encargos CLT": Math.round(p.encargos),
    "Benefícios": Math.round(p.beneficios),
  }))

  return (
    <div className="space-y-6">
      {/* ── Resumo ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumo.totalColaboradores}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Folha bruta / mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt.format(resumo.totalFolhaBruta)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Custo total empresa / mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{fmt.format(resumo.totalCustoEmpresa)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtPct((resumo.totalCustoEmpresa / resumo.totalFolhaBruta - 1) * 100)} acima da folha bruta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calculator className="h-4 w-4" />
              Custo médio por pessoa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt.format(resumo.custoMedioPorPessoa)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Gráfico ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composição do custo por projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosGrafico} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                width={64}
              />
              <Tooltip content={<TooltipGrafico />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Folha bruta" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Encargos CLT" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Benefícios" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Tabela por projeto ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por projeto</CardTitle>
          <p className="text-xs text-muted-foreground">Clique em um projeto para ver a distribuição por senioridade</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2 pl-3 pr-3 text-left font-medium text-xs text-muted-foreground">Projeto</th>
                  <th className="py-2 px-3 text-center font-medium text-xs text-muted-foreground">Pessoas</th>
                  <th className="py-2 px-3 text-right font-medium text-xs text-muted-foreground">Folha bruta</th>
                  <th className="py-2 px-3 text-right font-medium text-xs text-muted-foreground">Encargos CLT</th>
                  <th className="py-2 px-3 text-right font-medium text-xs text-muted-foreground">Benefícios</th>
                  <th className="py-2 px-3 text-right font-medium text-xs text-muted-foreground">Custo total</th>
                </tr>
              </thead>
              <tbody>
                {projetos.map((p, i) => (
                  <LinhaProjetoExpansivel
                    key={p.id}
                    projeto={p}
                    cor={CORES_PROJETOS[i % CORES_PROJETOS.length]}
                    totalCusto={resumo.totalCustoEmpresa}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20 font-semibold">
                  <td className="py-3 pl-3 pr-3 text-sm">Total geral</td>
                  <td className="py-3 px-3 text-center text-sm">{resumo.totalColaboradores}</td>
                  <td className="py-3 px-3 text-right text-sm">{fmt.format(resumo.totalFolhaBruta)}</td>
                  <td className="py-3 px-3 text-right text-sm">{fmt.format(resumo.totalEncargos)}</td>
                  <td className="py-3 px-3 text-right text-sm">{fmt.format(resumo.totalBeneficios)}</td>
                  <td className="py-3 px-3 text-right text-sm text-destructive">{fmt.format(resumo.totalCustoEmpresa)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Premissas de cálculo ── */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setMostrarEncargos(!mostrarEncargos)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Premissas de cálculo (encargos CLT estimados)</CardTitle>
            </div>
            {mostrarEncargos ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CardHeader>
        {mostrarEncargos && (
          <CardContent className="pt-0">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Encargos sobre folha */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Encargos sobre salário bruto (% aplicada)
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["INSS Patronal", percentuaisEncargos.inssPatronal, encargosDetalhamento.inssPatronal],
                      ["FGTS", percentuaisEncargos.fgts, encargosDetalhamento.fgts],
                      ["13º Salário (÷12)", percentuaisEncargos.decimoTerceiro, encargosDetalhamento.decimoTerceiro],
                      ["Férias + 1/3 (÷12)", percentuaisEncargos.feriasMaisAdicional, encargosDetalhamento.feriasMaisAdicional],
                      ["Sistema S", percentuaisEncargos.sistemaS, encargosDetalhamento.sistemaS],
                      ["RAT", percentuaisEncargos.rat, encargosDetalhamento.rat],
                    ].map(([label, pct, valor]) => (
                      <tr key={label as string} className="border-b last:border-0">
                        <td className="py-1.5 text-muted-foreground">{label as string}</td>
                        <td className="py-1.5 text-right text-muted-foreground">{fmtPct(pct as number)}</td>
                        <td className="py-1.5 text-right font-medium">{fmt.format(valor as number)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t">
                      <td className="py-2">Total encargos</td>
                      <td className="py-2 text-right">{fmtPct(percentuaisEncargos.totalSobreFolha)}</td>
                      <td className="py-2 text-right text-destructive">{fmt.format(resumo.totalEncargos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Benefícios fixos */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Benefícios fixos (por colaborador / mês)
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Vale Refeição", beneficiosFixos.valeRefeicao, encargosDetalhamento.valeRefeicao],
                      ["Vale Transporte (líquido)", beneficiosFixos.valeTransporte, encargosDetalhamento.valeTransporte],
                      ["Plano de Saúde", beneficiosFixos.planoSaude, encargosDetalhamento.planoSaude],
                    ].map(([label, porPessoa, total]) => (
                      <tr key={label as string} className="border-b last:border-0">
                        <td className="py-1.5 text-muted-foreground">{label as string}</td>
                        <td className="py-1.5 text-right text-muted-foreground">{fmt.format(porPessoa as number)}/pessoa</td>
                        <td className="py-1.5 text-right font-medium">{fmt.format(total as number)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t">
                      <td className="py-2">Total benefícios</td>
                      <td className="py-2 text-right">{fmt.format(beneficiosFixos.totalPorPessoa)}/pessoa</td>
                      <td className="py-2 text-right text-destructive">{fmt.format(resumo.totalBeneficios)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground mt-3">
                  * Valores estimados. Ajuste conforme o pacote de benefícios real da empresa.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
