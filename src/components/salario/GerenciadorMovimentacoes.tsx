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
import { Plus, Pencil, Trash2, DollarSign, ChevronRight } from "lucide-react"
import { formatarMoeda } from "@/lib/utils"

interface Colaborador {
  id: string
  nome: string
  funcao: string
  senioridade: string
}

interface Movimentacao {
  id: string
  colaboradorId: string
  colaborador: Colaborador
  salarioAtual: number
  fatorReajuste: number
  salarioProposto: number
  status: string
  observacoes: string | null
  cicloAno: number
  cicloMes: number
}

interface FormDados {
  colaboradorId: string
  salarioAtual: string
  fatorReajuste: string
  status: string
  observacoes: string
  cicloAno: string
  cicloMes: string
}

const hoje = new Date()
const formVazio: FormDados = {
  colaboradorId: "",
  salarioAtual: "",
  fatorReajuste: "",
  status: "PENDENTE",
  observacoes: "",
  cicloAno: String(hoje.getFullYear()),
  cicloMes: String(hoje.getMonth() + 1),
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const STATUS_MOV = [
  { valor: "PENDENTE", label: "Pendente" },
  { valor: "APROVADA", label: "Aprovada" },
  { valor: "APLICADA", label: "Aplicada" },
]

const STATUS_VARIANTE: Record<string, "warning" | "info" | "success"> = {
  PENDENTE: "warning",
  APROVADA: "info",
  APLICADA: "success",
}

const PROXIMO_STATUS: Record<string, string> = {
  PENDENTE: "APROVADA",
  APROVADA: "APLICADA",
}

const PROXIMO_LABEL: Record<string, string> = {
  PENDENTE: "Aprovar",
  APROVADA: "Aplicar",
}

export function GerenciadorMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Movimentacao | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Movimentacao | null>(null)
  const [formDados, setFormDados] = useState<FormDados>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState("")

  // Filtros
  const [filtroColaboradorId, setFiltroColaboradorId] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroCicloAno, setFiltroCicloAno] = useState("")
  const [filtroCicloMes, setFiltroCicloMes] = useState("")

  const salarioProposto =
    formDados.salarioAtual && formDados.fatorReajuste
      ? Number(formDados.salarioAtual) * (1 + Number(formDados.fatorReajuste) / 100)
      : null

  useEffect(() => {
    buscarColaboradores()
    buscarMovimentacoes()
  }, [])

  async function buscarColaboradores() {
    const r = await fetch("/api/colaboradores?ativo=true")
    const d = await r.json()
    if (r.ok) setColaboradores(d.dados)
  }

  async function buscarMovimentacoes() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (filtroColaboradorId) params.set("colaboradorId", filtroColaboradorId)
      if (filtroStatus) params.set("status", filtroStatus)
      if (filtroCicloAno) params.set("cicloAno", filtroCicloAno)
      if (filtroCicloMes) params.set("cicloMes", filtroCicloMes)

      const r = await fetch(`/api/movimentacoes-salariais?${params}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      setMovimentacoes(d.dados)
    } catch {
      setErro("Erro ao carregar movimentações")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarMovimentacoes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroColaboradorId, filtroStatus, filtroCicloAno, filtroCicloMes])

  function abrirCriar() {
    setEditando(null)
    setFormDados(formVazio)
    setErroForm("")
    setModalAberto(true)
  }

  function abrirEditar(m: Movimentacao) {
    setEditando(m)
    setFormDados({
      colaboradorId: m.colaboradorId,
      salarioAtual: String(m.salarioAtual),
      fatorReajuste: String(m.fatorReajuste),
      status: m.status,
      observacoes: m.observacoes ?? "",
      cicloAno: String(m.cicloAno),
      cicloMes: String(m.cicloMes),
    })
    setErroForm("")
    setModalAberto(true)
  }

  async function avancarStatus(m: Movimentacao) {
    const novoStatus = PROXIMO_STATUS[m.status]
    if (!novoStatus) return
    try {
      const r = await fetch(`/api/movimentacoes-salariais/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...m, status: novoStatus }),
      })
      if (!r.ok) throw new Error()
      await buscarMovimentacoes()
    } catch {
      setErro("Erro ao atualizar status")
    }
  }

  async function salvar() {
    setErroForm("")
    if (
      !formDados.colaboradorId ||
      !formDados.salarioAtual ||
      !formDados.fatorReajuste ||
      !formDados.cicloAno ||
      !formDados.cicloMes
    ) {
      setErroForm("Colaborador, salário, fator de reajuste e ciclo são obrigatórios")
      return
    }

    setSalvando(true)
    try {
      const url = editando
        ? `/api/movimentacoes-salariais/${editando.id}`
        : "/api/movimentacoes-salariais"
      const metodo = editando ? "PUT" : "POST"

      const r = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: formDados.colaboradorId,
          salarioAtual: Number(formDados.salarioAtual),
          fatorReajuste: Number(formDados.fatorReajuste),
          status: formDados.status,
          observacoes: formDados.observacoes || null,
          cicloAno: Number(formDados.cicloAno),
          cicloMes: Number(formDados.cicloMes),
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)

      await buscarMovimentacoes()
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
      const r = await fetch(`/api/movimentacoes-salariais/${confirmandoExclusao.id}`, {
        method: "DELETE",
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      await buscarMovimentacoes()
      setConfirmandoExclusao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir")
      setConfirmandoExclusao(null)
    } finally {
      setSalvando(false)
    }
  }

  const anos = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  return (
    <div className="space-y-4">
      {/* Filtros */}
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
          {STATUS_MOV.map((s) => (
            <option key={s.valor} value={s.valor}>{s.label}</option>
          ))}
        </Select>
        <Select
          value={filtroCicloAno}
          onChange={(e) => setFiltroCicloAno(e.target.value)}
          className="w-28"
        >
          <option value="">Ano</option>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select
          value={filtroCicloMes}
          onChange={(e) => setFiltroCicloMes(e.target.value)}
          className="w-36"
        >
          <option value="">Mês</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setFiltroColaboradorId("")
            setFiltroStatus("")
            setFiltroCicloAno("")
            setFiltroCicloMes("")
          }}
        >
          Limpar
        </Button>
        <Button onClick={abrirCriar} className="ml-auto">
          <Plus className="h-4 w-4" />
          Nova Movimentação
        </Button>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {carregando ? (
        <div className="py-12 text-center text-muted-foreground">Carregando movimentações...</div>
      ) : movimentacoes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <DollarSign className="h-10 w-10 opacity-30" />
          <p>Nenhuma movimentação encontrada</p>
          <Button variant="outline" onClick={abrirCriar}>Criar primeira movimentação</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead className="text-right">Salário Atual</TableHead>
                <TableHead className="text-center">Reajuste</TableHead>
                <TableHead className="text-right">Salário Proposto</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes.map((m) => {
                const diferenca = m.salarioProposto - m.salarioAtual
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{m.colaborador.nome}</p>
                        <p className="text-xs text-muted-foreground">{m.colaborador.funcao}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {MESES[m.cicloMes - 1]}/{m.cicloAno}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatarMoeda(m.salarioAtual)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm font-medium text-green-700">
                        +{m.fatorReajuste.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatarMoeda(m.salarioProposto)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-green-700">
                      +{formatarMoeda(diferenca)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTE[m.status] ?? "secondary"}>
                        {STATUS_MOV.find((s) => s.valor === m.status)?.label ?? m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {PROXIMO_STATUS[m.status] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => avancarStatus(m)}
                            title={PROXIMO_LABEL[m.status]}
                          >
                            <ChevronRight className="h-3 w-3" />
                            {PROXIMO_LABEL[m.status]}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEditar(m)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmandoExclusao(m)}
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
      )}

      {/* Modal criar/editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Movimentação" : "Nova Movimentação Salarial"}
            </DialogTitle>
            <DialogDescription>
              O salário proposto é calculado automaticamente com base no fator de reajuste.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="mv-colab">Colaborador *</Label>
              <Select
                id="mv-colab"
                value={formDados.colaboradorId}
                onChange={(e) => setFormDados({ ...formDados, colaboradorId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} — {c.funcao}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mv-ano">Ano do ciclo *</Label>
              <Select
                id="mv-ano"
                value={formDados.cicloAno}
                onChange={(e) => setFormDados({ ...formDados, cicloAno: e.target.value })}
              >
                {anos.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-mes">Mês do ciclo *</Label>
              <Select
                id="mv-mes"
                value={formDados.cicloMes}
                onChange={(e) => setFormDados({ ...formDados, cicloMes: e.target.value })}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mv-atual">Salário Atual (R$) *</Label>
              <Input
                id="mv-atual"
                type="number"
                min="0"
                step="0.01"
                value={formDados.salarioAtual}
                onChange={(e) => setFormDados({ ...formDados, salarioAtual: e.target.value })}
                placeholder="10000.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-fator">Fator de Reajuste (%) *</Label>
              <Input
                id="mv-fator"
                type="number"
                min="0"
                step="0.01"
                value={formDados.fatorReajuste}
                onChange={(e) => setFormDados({ ...formDados, fatorReajuste: e.target.value })}
                placeholder="10.50"
              />
            </div>

            {/* Salário proposto calculado */}
            {salarioProposto !== null && (
              <div className="sm:col-span-2 rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground">Salário Proposto (calculado)</p>
                <p className="text-xl font-bold text-green-700 font-mono">
                  {formatarMoeda(salarioProposto)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Diferença:{" "}
                  <span className="font-medium text-green-700">
                    +{formatarMoeda(salarioProposto - Number(formDados.salarioAtual))}
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="mv-status">Status</Label>
              <Select
                id="mv-status"
                value={formDados.status}
                onChange={(e) => setFormDados({ ...formDados, status: e.target.value })}
              >
                {STATUS_MOV.map((s) => (
                  <option key={s.valor} value={s.valor}>{s.label}</option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="mv-obs">Observações</Label>
              <textarea
                id="mv-obs"
                rows={2}
                value={formDados.observacoes}
                onChange={(e) => setFormDados({ ...formDados, observacoes: e.target.value })}
                placeholder="Justificativa ou observações opcionais..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : editando ? "Salvar" : "Criar"}
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
              Tem certeza que deseja excluir a movimentação de{" "}
              <strong>{confirmandoExclusao?.colaborador.nome}</strong> do ciclo{" "}
              {confirmandoExclusao &&
                `${MESES[confirmandoExclusao.cicloMes - 1]}/${confirmandoExclusao.cicloAno}`}
              ?
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
