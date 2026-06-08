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
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react"

interface Projeto {
  id: string
  nome: string
}

interface Colaborador {
  id: string
  nome: string
  usuario: string
  funcao: string
  senioridade: string
  ativo: boolean
  projetoId: string | null
  projeto: { id: string; nome: string } | null
  liderId: string | null
  lider: { id: string; nome: string } | null
}

interface FormDados {
  nome: string
  usuario: string
  funcao: string
  senioridade: string
  ativo: boolean
  projetoId: string
  liderId: string
}

const formVazio: FormDados = {
  nome: "",
  usuario: "",
  funcao: "",
  senioridade: "PLENO",
  ativo: true,
  projetoId: "",
  liderId: "",
}

const SENIORIDADES = [
  { valor: "JUNIOR", label: "Júnior" },
  { valor: "PLENO", label: "Pleno" },
  { valor: "SENIOR", label: "Sênior" },
  { valor: "STAFF", label: "Staff" },
  { valor: "PRINCIPAL", label: "Principal" },
]

function badgeSenioridade(s: string) {
  const mapa: Record<string, "info" | "success" | "warning" | "purple" | "default"> = {
    JUNIOR: "info",
    PLENO: "success",
    SENIOR: "warning",
    STAFF: "purple",
    PRINCIPAL: "default",
  }
  const labels: Record<string, string> = {
    JUNIOR: "Júnior",
    PLENO: "Pleno",
    SENIOR: "Sênior",
    STAFF: "Staff",
    PRINCIPAL: "Principal",
  }
  return <Badge variant={mapa[s] ?? "default"}>{labels[s] ?? s}</Badge>
}

export function GerenciadorColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Colaborador | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Colaborador | null>(null)
  const [formDados, setFormDados] = useState<FormDados>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState("")

  // Filtros
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroProjetoId, setFiltroProjetoId] = useState("")
  const [filtroSenioridade, setFiltroSenioridade] = useState("")
  const [filtroAtivo, setFiltroAtivo] = useState("true")

  useEffect(() => {
    buscarProjetos()
    buscarColaboradores()
  }, [])

  async function buscarProjetos() {
    const r = await fetch("/api/projetos")
    const d = await r.json()
    if (r.ok) setProjetos(d.dados)
  }

  async function buscarColaboradores() {
    try {
      setCarregando(true)
      const params = new URLSearchParams()
      if (filtroProjetoId) params.set("projetoId", filtroProjetoId)
      if (filtroSenioridade) params.set("senioridade", filtroSenioridade)
      if (filtroAtivo !== "") params.set("ativo", filtroAtivo)

      const resposta = await fetch(`/api/colaboradores?${params}`)
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      setColaboradores(dados.dados)
    } catch {
      setErro("Erro ao carregar colaboradores")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarColaboradores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroProjetoId, filtroSenioridade, filtroAtivo])

  const colaboradoresFiltrados = colaboradores.filter((c) =>
    c.nome.toLowerCase().includes(filtroNome.toLowerCase()) ||
    c.usuario.toLowerCase().includes(filtroNome.toLowerCase()) ||
    c.funcao.toLowerCase().includes(filtroNome.toLowerCase())
  )

  function abrirCriar() {
    setEditando(null)
    setFormDados(formVazio)
    setErroForm("")
    setModalAberto(true)
  }

  function abrirEditar(c: Colaborador) {
    setEditando(c)
    setFormDados({
      nome: c.nome,
      usuario: c.usuario,
      funcao: c.funcao,
      senioridade: c.senioridade,
      ativo: c.ativo,
      projetoId: c.projetoId ?? "",
      liderId: c.liderId ?? "",
    })
    setErroForm("")
    setModalAberto(true)
  }

  async function salvar() {
    setErroForm("")
    if (!formDados.nome.trim() || !formDados.usuario.trim() || !formDados.funcao.trim()) {
      setErroForm("Nome, usuário e função são obrigatórios")
      return
    }

    setSalvando(true)
    try {
      const url = editando ? `/api/colaboradores/${editando.id}` : "/api/colaboradores"
      const metodo = editando ? "PUT" : "POST"
      const corpo = {
        ...formDados,
        projetoId: formDados.projetoId || null,
        liderId: formDados.liderId || null,
      }

      const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)

      await buscarColaboradores()
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
      const resposta = await fetch(`/api/colaboradores/${confirmandoExclusao.id}`, { method: "DELETE" })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      await buscarColaboradores()
      setConfirmandoExclusao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir")
      setConfirmandoExclusao(null)
    } finally {
      setSalvando(false)
    }
  }

  const outrosColaboradores = colaboradores.filter((c) => c.id !== editando?.id)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, usuário ou função..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filtroProjetoId} onChange={(e) => setFiltroProjetoId(e.target.value)} className="w-48">
          <option value="">Todos os projetos</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </Select>
        <Select value={filtroSenioridade} onChange={(e) => setFiltroSenioridade(e.target.value)} className="w-40">
          <option value="">Todas senioridades</option>
          {SENIORIDADES.map((s) => (
            <option key={s.valor} value={s.valor}>{s.label}</option>
          ))}
        </Select>
        <Select value={filtroAtivo} onChange={(e) => setFiltroAtivo(e.target.value)} className="w-36">
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
          <option value="">Todos</option>
        </Select>
        <Button onClick={abrirCriar}>
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {carregando ? (
        <div className="py-12 text-center text-muted-foreground">Carregando colaboradores...</div>
      ) : colaboradoresFiltrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <Users className="h-10 w-10 opacity-30" />
          <p>Nenhum colaborador encontrado</p>
          <Button variant="outline" onClick={abrirCriar}>Adicionar colaborador</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Senioridade</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Líder</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradoresFiltrados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.usuario}</TableCell>
                  <TableCell>{c.funcao}</TableCell>
                  <TableCell>{badgeSenioridade(c.senioridade)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.projeto?.nome ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.lider?.nome ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.ativo ? "success" : "secondary"}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmandoExclusao(c)}
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
            <DialogTitle>
              {editando ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados do colaborador." : "Preencha os dados para adicionar um colaborador."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-nome">Nome completo *</Label>
              <Input
                id="c-nome"
                value={formDados.nome}
                onChange={(e) => setFormDados({ ...formDados, nome: e.target.value })}
                placeholder="Nome Sobrenome"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-usuario">Usuário *</Label>
              <Input
                id="c-usuario"
                value={formDados.usuario}
                onChange={(e) => setFormDados({ ...formDados, usuario: e.target.value })}
                placeholder="nome.sobrenome"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-funcao">Função *</Label>
              <Input
                id="c-funcao"
                value={formDados.funcao}
                onChange={(e) => setFormDados({ ...formDados, funcao: e.target.value })}
                placeholder="Engenheiro de Software"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-senioridade">Senioridade *</Label>
              <Select
                id="c-senioridade"
                value={formDados.senioridade}
                onChange={(e) => setFormDados({ ...formDados, senioridade: e.target.value })}
              >
                {SENIORIDADES.map((s) => (
                  <option key={s.valor} value={s.valor}>{s.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-projeto">Projeto</Label>
              <Select
                id="c-projeto"
                value={formDados.projetoId}
                onChange={(e) => setFormDados({ ...formDados, projetoId: e.target.value })}
              >
                <option value="">Sem projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-lider">Líder direto</Label>
              <Select
                id="c-lider"
                value={formDados.liderId}
                onChange={(e) => setFormDados({ ...formDados, liderId: e.target.value })}
              >
                <option value="">Sem líder</option>
                {outrosColaboradores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formDados.ativo}
                  onChange={(e) => setFormDados({ ...formDados, ativo: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Colaborador ativo</span>
              </label>
            </div>
          </div>

          {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : editando ? "Salvar" : "Adicionar"}
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
              Tem certeza que deseja excluir{" "}
              <strong>{confirmandoExclusao?.nome}</strong>? Todos os feedbacks,
              ocorrências e movimentações salariais vinculadas também serão excluídos.
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
