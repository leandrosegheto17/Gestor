"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Pencil,
  Trash2,
  Palmtree,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { formatarData } from "@/lib/utils"

interface Colaborador {
  id: string
  nome: string
}

interface Ferias {
  id: string
  colaboradorId: string
  colaborador: { id: string; nome: string }
  dataInicio: string
  dataFim: string
  status: string
  observacoes: string | null
}

interface FormDados {
  colaboradorId: string
  dataInicio: string
  dataFim: string
  status: string
  observacoes: string
}

const formVazio: FormDados = {
  colaboradorId: "",
  dataInicio: "",
  dataFim: "",
  status: "AGENDADA",
  observacoes: "",
}

const STATUS_FERIAS = [
  { valor: "AGENDADA", label: "Agendada" },
  { valor: "EM_CURSO", label: "Em curso" },
  { valor: "CONCLUIDA", label: "Concluída" },
]

const STATUS_VARIANTE: Record<string, "info" | "success" | "secondary"> = {
  AGENDADA: "info",
  EM_CURSO: "success",
  CONCLUIDA: "secondary",
}

// Paleta de cores para colaboradores no calendário
const CORES_CALENDARIO = [
  "bg-blue-200 text-blue-900",
  "bg-emerald-200 text-emerald-900",
  "bg-violet-200 text-violet-900",
  "bg-amber-200 text-amber-900",
  "bg-rose-200 text-rose-900",
  "bg-cyan-200 text-cyan-900",
  "bg-orange-200 text-orange-900",
  "bg-teal-200 text-teal-900",
]

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES_NOME = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function parsearData(iso: string): Date {
  const [ano, mes, dia] = iso.split("T")[0].split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function calcularDuracao(inicio: string, fim: string): number {
  const d1 = parsearData(inicio)
  const d2 = parsearData(fim)
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000) + 1
}

function temSobreposicao(todas: Ferias[], alvo: Ferias): boolean {
  const ini = parsearData(alvo.dataInicio)
  const fim = parsearData(alvo.dataFim)
  return todas.some(
    (f) =>
      f.id !== alvo.id &&
      parsearData(f.dataInicio) <= fim &&
      parsearData(f.dataFim) >= ini
  )
}

function gerarSemanas(ano: number, mes: number): Date[][] {
  const primeiro = new Date(ano, mes, 1)
  const ultimo = new Date(ano, mes + 1, 0)
  const dias: Date[] = []

  for (let i = 0; i < primeiro.getDay(); i++) {
    dias.push(new Date(ano, mes, -i + 0 - (primeiro.getDay() - 1 - i)))
  }
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(ano, mes, d))
  while (dias.length % 7 !== 0) dias.push(new Date(ano, mes + 1, dias.length - ultimo.getDate() - primeiro.getDay() + 1))

  const semanas: Date[][] = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7))
  return semanas
}

function feriasNoDia(todas: Ferias[], dia: Date): Ferias[] {
  const ts = dia.getTime()
  return todas.filter((f) => {
    const ini = parsearData(f.dataInicio).getTime()
    const fim = parsearData(f.dataFim).getTime()
    return ts >= ini && ts <= fim
  })
}

// ─── Vista calendário ────────────────────────────────────────────────────────

function Calendario({
  ferias,
  corPorColab,
}: {
  ferias: Ferias[]
  corPorColab: Map<string, string>
}) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  const semanas = gerarSemanas(ano, mes)

  function anterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1) }
    else setMes(mes - 1)
  }
  function proximo() {
    if (mes === 11) { setMes(0); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* Cabeçalho navegação */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={anterior}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {MESES_NOME[mes]} {ano}
        </h3>
        <Button variant="ghost" size="icon" onClick={proximo}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid de dias */}
      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {semanas.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 gap-0.5">
            {semana.map((dia, di) => {
              const doMesAtual = dia.getMonth() === mes
              const ehHoje =
                dia.getDate() === hoje.getDate() &&
                dia.getMonth() === hoje.getMonth() &&
                dia.getFullYear() === hoje.getFullYear()
              const feriasNeste = feriasNoDia(ferias, dia)
              const temOverlap = feriasNeste.length >= 2

              return (
                <div
                  key={di}
                  className={`min-h-[72px] rounded-md p-1 border ${
                    !doMesAtual
                      ? "bg-muted/20 border-transparent"
                      : temOverlap
                      ? "bg-orange-50 border-orange-200"
                      : feriasNeste.length === 1
                      ? "bg-background border-border"
                      : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        ehHoje
                          ? "bg-primary text-primary-foreground"
                          : !doMesAtual
                          ? "text-muted-foreground/40"
                          : "text-foreground"
                      }`}
                    >
                      {dia.getDate()}
                    </span>
                    {temOverlap && doMesAtual && (
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {feriasNeste.slice(0, 2).map((f) => {
                      const primeiroNome = f.colaborador.nome.split(" ")[0]
                      const cor = corPorColab.get(f.colaboradorId) ?? CORES_CALENDARIO[0]
                      return (
                        <div
                          key={f.id}
                          className={`rounded px-1 py-0.5 text-[10px] font-medium truncate ${cor}`}
                          title={`${f.colaborador.nome} (${formatarData(f.dataInicio)} – ${formatarData(f.dataFim)})`}
                        >
                          {primeiroNome}
                        </div>
                      )
                    })}
                    {feriasNeste.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{feriasNeste.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-orange-100 border border-orange-200" />
          Sobreposição (2+ pessoas)
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-orange-500" />
          Alerta de sobreposição
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function GerenciadorFerias() {
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [vista, setVista] = useState<"lista" | "calendario">("lista")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Ferias | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Ferias | null>(null)
  const [formDados, setFormDados] = useState<FormDados>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState("")

  // Filtros
  const [filtroColaboradorId, setFiltroColaboradorId] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  useEffect(() => {
    buscarColaboradores()
    buscarFerias()
  }, [])

  async function buscarColaboradores() {
    const r = await fetch("/api/colaboradores?ativo=true")
    const d = await r.json()
    if (r.ok) setColaboradores(d.dados)
  }

  async function buscarFerias() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (filtroColaboradorId) params.set("colaboradorId", filtroColaboradorId)
      if (filtroStatus) params.set("status", filtroStatus)

      const r = await fetch(`/api/ferias?${params}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      setFerias(d.dados)
    } catch {
      setErro("Erro ao carregar férias")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarFerias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroColaboradorId, filtroStatus])

  // Mapa de cores por colaborador (estável por ID)
  const corPorColab = new Map<string, string>()
  const colabsComFerias = Array.from(new Set(ferias.map((f) => f.colaboradorId)))
  colabsComFerias.forEach((id, i) => {
    corPorColab.set(id, CORES_CALENDARIO[i % CORES_CALENDARIO.length])
  })

  function abrirCriar() {
    setEditando(null)
    setFormDados(formVazio)
    setErroForm("")
    setModalAberto(true)
  }

  function abrirEditar(f: Ferias) {
    setEditando(f)
    setFormDados({
      colaboradorId: f.colaboradorId,
      dataInicio: f.dataInicio.split("T")[0],
      dataFim: f.dataFim.split("T")[0],
      status: f.status,
      observacoes: f.observacoes ?? "",
    })
    setErroForm("")
    setModalAberto(true)
  }

  async function salvar() {
    setErroForm("")
    if (!formDados.colaboradorId || !formDados.dataInicio || !formDados.dataFim) {
      setErroForm("Colaborador, data de início e data de fim são obrigatórios")
      return
    }
    if (formDados.dataInicio > formDados.dataFim) {
      setErroForm("A data de início deve ser anterior ou igual à data de fim")
      return
    }

    setSalvando(true)
    try {
      const url = editando ? `/api/ferias/${editando.id}` : "/api/ferias"
      const metodo = editando ? "PUT" : "POST"

      const r = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDados),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)

      await buscarFerias()
      setModalAberto(false)
    } catch (e) {
      setErroForm(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!confirmandoExclusao) return
    setSalvando(true)
    try {
      const r = await fetch(`/api/ferias/${confirmandoExclusao.id}`, { method: "DELETE" })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      await buscarFerias()
      setConfirmandoExclusao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir")
      setConfirmandoExclusao(null)
    } finally {
      setSalvando(false)
    }
  }

  const totalSobreposicoes = ferias.filter((f) => temSobreposicao(ferias, f)).length / 2

  return (
    <div className="space-y-4">
      {/* Barra de controles */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          value={filtroColaboradorId}
          onChange={(e) => setFiltroColaboradorId(e.target.value)}
          className="w-52"
        >
          <option value="">Todos os colaboradores</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
        <Select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-36"
        >
          <option value="">Todos os status</option>
          {STATUS_FERIAS.map((s) => (
            <option key={s.valor} value={s.valor}>{s.label}</option>
          ))}
        </Select>

        {/* Toggle de vista */}
        <div className="flex rounded-md border overflow-hidden">
          <button
            onClick={() => setVista("lista")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
              vista === "lista"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            <List className="h-4 w-4" /> Lista
          </button>
          <button
            onClick={() => setVista("calendario")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l ${
              vista === "calendario"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            <CalendarDays className="h-4 w-4" /> Calendário
          </button>
        </div>

        <Button onClick={abrirCriar} className="ml-auto">
          <Plus className="h-4 w-4" />
          Agendar Férias
        </Button>
      </div>

      {/* Alerta de sobreposições */}
      {totalSobreposicoes > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{Math.round(totalSobreposicoes)}</strong> sobreposição
            {Math.round(totalSobreposicoes) !== 1 ? "ões" : ""} detectada
            {Math.round(totalSobreposicoes) !== 1 ? "s" : ""} — dois ou mais
            colaboradores com férias no mesmo período.
          </span>
        </div>
      )}

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {carregando ? (
        <div className="py-12 text-center text-muted-foreground">Carregando férias...</div>
      ) : ferias.length === 0 && vista === "lista" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <Palmtree className="h-10 w-10 opacity-30" />
          <p>Nenhum período de férias registrado</p>
          <Button variant="outline" onClick={abrirCriar}>Agendar férias</Button>
        </div>
      ) : vista === "lista" ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead className="text-center">Dias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ferias.map((f) => {
                const overlap = temSobreposicao(ferias, f)
                return (
                  <TableRow key={f.id} className={overlap ? "bg-orange-50/50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            (corPorColab.get(f.colaboradorId) ?? "").split(" ")[0]
                          }`}
                        />
                        <span className="font-medium">{f.colaborador.nome}</span>
                        {overlap && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-orange-500"
                            title="Sobreposição com outro colaborador"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatarData(f.dataInicio)}</TableCell>
                    <TableCell className="text-sm">{formatarData(f.dataFim)}</TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {calcularDuracao(f.dataInicio, f.dataFim)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTE[f.status] ?? "secondary"}>
                        {STATUS_FERIAS.find((s) => s.valor === f.status)?.label ?? f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-muted-foreground" title={f.observacoes ?? ""}>
                        {f.observacoes ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(f)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmandoExclusao(f)}
                          className="text-destructive hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Calendario ferias={ferias} corPorColab={corPorColab} />
      )}

      {/* Modal criar/editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Férias" : "Agendar Férias"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Atualize os dados do período de férias."
                : "Registre um período de férias para um colaborador."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fer-colab">Colaborador *</Label>
              <Select
                id="fer-colab"
                value={formDados.colaboradorId}
                onChange={(e) => setFormDados({ ...formDados, colaboradorId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fer-inicio">Data de início *</Label>
                <Input
                  id="fer-inicio"
                  type="date"
                  value={formDados.dataInicio}
                  onChange={(e) => setFormDados({ ...formDados, dataInicio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fer-fim">Data de fim *</Label>
                <Input
                  id="fer-fim"
                  type="date"
                  value={formDados.dataFim}
                  min={formDados.dataInicio}
                  onChange={(e) => setFormDados({ ...formDados, dataFim: e.target.value })}
                />
              </div>
            </div>

            {formDados.dataInicio && formDados.dataFim && formDados.dataInicio <= formDados.dataFim && (
              <p className="text-sm text-muted-foreground">
                Duração:{" "}
                <strong>{calcularDuracao(formDados.dataInicio, formDados.dataFim)}</strong> dia(s)
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fer-status">Status</Label>
              <Select
                id="fer-status"
                value={formDados.status}
                onChange={(e) => setFormDados({ ...formDados, status: e.target.value })}
              >
                {STATUS_FERIAS.map((s) => (
                  <option key={s.valor} value={s.valor}>{s.label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fer-obs">Observações</Label>
              <textarea
                id="fer-obs"
                rows={2}
                value={formDados.observacoes}
                onChange={(e) => setFormDados({ ...formDados, observacoes: e.target.value })}
                placeholder="Observações opcionais..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : editando ? "Salvar" : "Agendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar exclusão */}
      <Dialog open={!!confirmandoExclusao} onOpenChange={() => setConfirmandoExclusao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir as férias de{" "}
              <strong>{confirmandoExclusao?.colaborador.nome}</strong> (
              {confirmandoExclusao && formatarData(confirmandoExclusao.dataInicio)} –{" "}
              {confirmandoExclusao && formatarData(confirmandoExclusao.dataFim)})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmandoExclusao(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={excluir} disabled={salvando}>
              {salvando ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
