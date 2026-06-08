"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react"

interface Projeto {
  id: string
  nome: string
  tecnologia: string
  _count: { colaboradores: number }
}

interface FormDados {
  nome: string
  tecnologia: string
}

const formVazio: FormDados = { nome: "", tecnologia: "" }

export function GerenciadorProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [projetoEditando, setProjetoEditando] = useState<Projeto | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Projeto | null>(null)
  const [formDados, setFormDados] = useState<FormDados>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState("")

  useEffect(() => {
    buscarProjetos()
  }, [])

  async function buscarProjetos() {
    try {
      setCarregando(true)
      const resposta = await fetch("/api/projetos")
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      setProjetos(dados.dados)
    } catch {
      setErro("Erro ao carregar projetos")
    } finally {
      setCarregando(false)
    }
  }

  function abrirCriar() {
    setProjetoEditando(null)
    setFormDados(formVazio)
    setErroForm("")
    setModalAberto(true)
  }

  function abrirEditar(projeto: Projeto) {
    setProjetoEditando(projeto)
    setFormDados({ nome: projeto.nome, tecnologia: projeto.tecnologia })
    setErroForm("")
    setModalAberto(true)
  }

  async function salvar() {
    setErroForm("")
    if (!formDados.nome.trim() || !formDados.tecnologia.trim()) {
      setErroForm("Nome e tecnologia são obrigatórios")
      return
    }

    setSalvando(true)
    try {
      const url = projetoEditando ? `/api/projetos/${projetoEditando.id}` : "/api/projetos"
      const metodo = projetoEditando ? "PUT" : "POST"

      const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDados),
      })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)

      await buscarProjetos()
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
      const resposta = await fetch(`/api/projetos/${confirmandoExclusao.id}`, { method: "DELETE" })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados.erro)
      await buscarProjetos()
      setConfirmandoExclusao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir")
      setConfirmandoExclusao(null)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Carregando projetos...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projetos.length} projeto{projetos.length !== 1 ? "s" : ""} cadastrado{projetos.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={abrirCriar}>
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{erro}</p>
      )}

      {projetos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <FolderKanban className="h-10 w-10 opacity-30" />
          <p>Nenhum projeto cadastrado</p>
          <Button variant="outline" onClick={abrirCriar}>
            Criar primeiro projeto
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tecnologia</TableHead>
                <TableHead className="text-center">Colaboradores</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetos.map((projeto) => (
                <TableRow key={projeto.id}>
                  <TableCell className="font-medium">{projeto.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{projeto.tecnologia}</TableCell>
                  <TableCell className="text-center">{projeto._count.colaboradores}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEditar(projeto)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmandoExclusao(projeto)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {projetoEditando ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
            <DialogDescription>
              {projetoEditando
                ? "Atualize os dados do projeto."
                : "Preencha os dados para criar um novo projeto."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formDados.nome}
                onChange={(e) => setFormDados({ ...formDados, nome: e.target.value })}
                placeholder="Nome do projeto"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tecnologia">Tecnologia</Label>
              <Input
                id="tecnologia"
                value={formDados.tecnologia}
                onChange={(e) => setFormDados({ ...formDados, tecnologia: e.target.value })}
                placeholder="Ex: Node.js / React"
              />
            </div>
            {erroForm && (
              <p className="text-sm text-destructive">{erroForm}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : projetoEditando ? "Salvar" : "Criar"}
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
              Tem certeza que deseja excluir o projeto{" "}
              <strong>{confirmandoExclusao?.nome}</strong>? Esta ação não pode ser
              desfeita.
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
