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
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { formatarData } from "@/lib/utils"

interface Colaborador {
  id: string
  nome: string
}

interface Ocorrencia {
  id: string
  colaboradorId: string
  colaborador: { id: string; nome: string }
  data: string
  tipo: string
  gravidade: number
  descricao: string
}

interface FormDados {
  colaboradorId: string
  data: string
  tipo: string
  gravidade: number
  descricao: string
}

const formVazio: FormDados = {
  colaboradorId: "",
  data: new Date().toISOString().split("T")[0],
  tipo: "POSITIVA",
  gravidade: 3,
  descricao: "",
}

const TIPOS_OCORRENCIA = [
  { valor: "POSITIVA", label: "Positiva" },
  { valor: "NEGATIVA", label: "Negativa" },
]

function IndicadorGravidade({ valor }: { valor: number }) {
  const cores = ["", "bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-600"]
  const labels = ["", "Muito Baixa", "Baixa", "Média", "Alta", "Crítica"]
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-sm ${i <= valor ? cores[valor] : "bg-muted"}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{labels[valor]}</span>
    </div>
  )
}

export function GerenciadorOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Ocorrencia | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Ocorrencia | null>(null)
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
    buscarOcorrencias()
  }, [])

  async function buscarColaboradores() {
    const r = await fetch("/api/colaboradores?ativo=true")
    const d = await r.json()
    if (r.ok) setColaboradores(d.dados)
  }

  async function buscarOcorrencias() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (filtroColaboradorId) params.set("colaboradorId", filtroColaboradorId)
      if (filtroTipo) params.set("tipo", filtroTipo)
      if (filtroDataInicio) params.set("dataInicio", filtroDataInicio)
      if (filtroDataFim) params.set("dataFim", filtroDataFim)

      const resposta = await fetch(`/api/ocorrencias?${params}`)
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      setOcorrencias(dados.dados)
    } catch {
      setErro("Erro ao carregar ocorrências")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarOcorrencias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroColaboradorId, filtroTipo, filtroDataInicio, filtroDataFim])

  function abrirCriar() {
    setEditando(null)
    setFormDados(formVazio)
    setErroForm("")
    setModalAberto(true)
  }

  function abrirEditar(o: Ocorrencia) {
    setEditando(o)
    setFormDados({
      colaboradorId: o.colaboradorId,
      data: o.data.split("T")[0],
      tipo: o.tipo,
      gravidade: o.gravidade,
      descricao: o.descricao,
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
      const url = editando ? `/api/ocorrencias/${editando.id}` : "/api/ocorrencias"
      const metodo = editando ? "PUT" : "POST"

      const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDados),
      })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)

      await buscarOcorrencias()
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
      const resposta = await fetch(`/api/ocorrencias/${confirmandoExclusao.id}`, { method: "DELETE" })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      await buscarOcorrencias()
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
          className="w-36"
        >
          <option value="">Todos os tipos</option>
          {TIPOS_OCORRENCIA.map((t) => (
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
          Registrar Ocorrência
        </Button>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {carregando ? (
        <div className="py-12 text-center text-muted-foreground">Carregando ocorrências...</div>
      ) : ocorrencias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 opacity-30" />
          <p>Nenhuma ocorrência encontrada</p>
          <Button variant="outline" onClick={abrirCriar}>Registrar primeira ocorrência</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Gravidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ocorrencias.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.colaborador.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatarData(o.data)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.tipo === "POSITIVA" ? "success" : "destructive"}>
                      {o.tipo === "POSITIVA" ? "Positiva" : "Negativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <IndicadorGravidade valor={o.gravidade} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm" title={o.descricao}>
                      {o.descricao}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(o)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmandoExclusao(o)}
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
            <DialogTitle>{editando ? "Editar Ocorrência" : "Registrar Ocorrência"}</DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados da ocorrência." : "Registre uma ocorrência para um colaborador."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="o-colab">Colaborador *</Label>
                <Select
                  id="o-colab"
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
                <Label htmlFor="o-data">Data *</Label>
                <Input
                  id="o-data"
                  type="date"
                  value={formDados.data}
                  onChange={(e) => setFormDados({ ...formDados, data: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-tipo">Tipo *</Label>
                <Select
                  id="o-tipo"
                  value={formDados.tipo}
                  onChange={(e) => setFormDados({ ...formDados, tipo: e.target.value })}
                >
                  {TIPOS_OCORRENCIA.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-grav">
                  Gravidade: <strong>{formDados.gravidade}</strong>/5
                </Label>
                <input
                  id="o-grav"
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={formDados.gravidade}
                  onChange={(e) => setFormDados({ ...formDados, gravidade: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Muito Baixa</span>
                  <span>Crítica</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-desc">Descrição *</Label>
              <textarea
                id="o-desc"
                rows={4}
                value={formDados.descricao}
                onChange={(e) => setFormDados({ ...formDados, descricao: e.target.value })}
                placeholder="Descreva a ocorrência em detalhes..."
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
              Tem certeza que deseja excluir esta ocorrência de{" "}
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
