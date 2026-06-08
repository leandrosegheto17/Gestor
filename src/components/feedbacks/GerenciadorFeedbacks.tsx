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
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react"
import { formatarData } from "@/lib/utils"

interface Colaborador {
  id: string
  nome: string
}

interface Feedback {
  id: string
  colaboradorId: string
  colaborador: { id: string; nome: string }
  data: string
  tipo: string
  fonte: string
  descricao: string
}

interface FormDados {
  colaboradorId: string
  data: string
  tipo: string
  fonte: string
  descricao: string
}

const formVazio: FormDados = {
  colaboradorId: "",
  data: new Date().toISOString().split("T")[0],
  tipo: "POSITIVO",
  fonte: "GESTOR",
  descricao: "",
}

const TIPOS_FEEDBACK = [
  { valor: "POSITIVO", label: "Positivo" },
  { valor: "CONSTRUTIVO", label: "Construtivo" },
  { valor: "NEUTRO", label: "Neutro" },
]

const FONTES_FEEDBACK = [
  { valor: "GESTOR", label: "Gestor" },
  { valor: "LIDER_DIRETO", label: "Líder Direto" },
  { valor: "COLEGA", label: "Colega" },
  { valor: "CLIENTE", label: "Cliente" },
]

const TIPO_VARIANTE: Record<string, "success" | "warning" | "secondary"> = {
  POSITIVO: "success",
  CONSTRUTIVO: "warning",
  NEUTRO: "secondary",
}

const TIPO_LABEL: Record<string, string> = {
  POSITIVO: "Positivo",
  CONSTRUTIVO: "Construtivo",
  NEUTRO: "Neutro",
}

const FONTE_LABEL: Record<string, string> = {
  GESTOR: "Gestor",
  LIDER_DIRETO: "Líder Direto",
  COLEGA: "Colega",
  CLIENTE: "Cliente",
}

export function GerenciadorFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Feedback | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Feedback | null>(null)
  const [formDados, setFormDados] = useState<FormDados>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState("")

  // Filtros
  const [filtroColaboradorId, setFiltroColaboradorId] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

  useEffect(() => {
    buscarColaboradores()
    buscarFeedbacks()
  }, [])

  async function buscarColaboradores() {
    const r = await fetch("/api/colaboradores?ativo=true")
    const d = await r.json()
    if (r.ok) setColaboradores(d.dados)
  }

  async function buscarFeedbacks() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (filtroColaboradorId) params.set("colaboradorId", filtroColaboradorId)
      if (filtroTipo) params.set("tipo", filtroTipo)
      if (filtroDataInicio) params.set("dataInicio", filtroDataInicio)
      if (filtroDataFim) params.set("dataFim", filtroDataFim)

      const resposta = await fetch(`/api/feedbacks?${params}`)
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      setFeedbacks(dados.dados)
    } catch {
      setErro("Erro ao carregar feedbacks")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroColaboradorId, filtroTipo, filtroDataInicio, filtroDataFim])

  function abrirCriar() {
    setEditando(null)
    setFormDados(formVazio)
    setErroForm("")
    setModalAberto(true)
  }

  function abrirEditar(f: Feedback) {
    setEditando(f)
    setFormDados({
      colaboradorId: f.colaboradorId,
      data: f.data.split("T")[0],
      tipo: f.tipo,
      fonte: f.fonte,
      descricao: f.descricao,
    })
    setErroForm("")
    setModalAberto(true)
  }

  async function salvar() {
    setErroForm("")
    if (!formDados.colaboradorId || !formDados.descricao.trim()) {
      setErroForm("Colaborador e descrição são obrigatórios")
      return
    }

    setSalvando(true)
    try {
      const url = editando ? `/api/feedbacks/${editando.id}` : "/api/feedbacks"
      const metodo = editando ? "PUT" : "POST"

      const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDados),
      })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)

      await buscarFeedbacks()
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
      const resposta = await fetch(`/api/feedbacks/${confirmandoExclusao.id}`, { method: "DELETE" })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      await buscarFeedbacks()
      setConfirmandoExclusao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir")
      setConfirmandoExclusao(null)
    } finally {
      setSalvando(false)
    }
  }

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
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="w-40"
        >
          <option value="">Todos os tipos</option>
          {TIPOS_FEEDBACK.map((t) => (
            <option key={t.valor} value={t.valor}>{t.label}</option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="w-36"
            title="Data início"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="w-36"
            title="Data fim"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFiltroColaboradorId("")
            setFiltroTipo("")
            setFiltroDataInicio("")
            setFiltroDataFim("")
          }}
        >
          Limpar filtros
        </Button>
        <Button onClick={abrirCriar} className="ml-auto">
          <Plus className="h-4 w-4" />
          Registrar Feedback
        </Button>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {carregando ? (
        <div className="py-12 text-center text-muted-foreground">Carregando feedbacks...</div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 opacity-30" />
          <p>Nenhum feedback encontrado</p>
          <Button variant="outline" onClick={abrirCriar}>Registrar primeiro feedback</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.colaborador.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatarData(f.data)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TIPO_VARIANTE[f.tipo] ?? "secondary"}>
                      {TIPO_LABEL[f.tipo] ?? f.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {FONTE_LABEL[f.fonte] ?? f.fonte}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm" title={f.descricao}>
                      {f.descricao}
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
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Feedback" : "Registrar Feedback"}</DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados do feedback." : "Registre um feedback para um colaborador."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="f-colab">Colaborador *</Label>
                <Select
                  id="f-colab"
                  value={formDados.colaboradorId}
                  onChange={(e) => setFormDados({ ...formDados, colaboradorId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-data">Data *</Label>
                <Input
                  id="f-data"
                  type="date"
                  value={formDados.data}
                  onChange={(e) => setFormDados({ ...formDados, data: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-tipo">Tipo *</Label>
                <Select
                  id="f-tipo"
                  value={formDados.tipo}
                  onChange={(e) => setFormDados({ ...formDados, tipo: e.target.value })}
                >
                  {TIPOS_FEEDBACK.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-fonte">Fonte *</Label>
                <Select
                  id="f-fonte"
                  value={formDados.fonte}
                  onChange={(e) => setFormDados({ ...formDados, fonte: e.target.value })}
                >
                  {FONTES_FEEDBACK.map((f) => (
                    <option key={f.valor} value={f.valor}>{f.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-desc">Descrição *</Label>
              <textarea
                id="f-desc"
                rows={4}
                value={formDados.descricao}
                onChange={(e) => setFormDados({ ...formDados, descricao: e.target.value })}
                placeholder="Descreva o feedback em detalhes..."
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
              {salvando ? "Salvando..." : editando ? "Salvar" : "Registrar"}
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
              Tem certeza que deseja excluir este feedback de{" "}
              <strong>{confirmandoExclusao?.colaborador.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmandoExclusao(null)} disabled={salvando}>
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
