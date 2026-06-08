import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const projeto = await prisma.projeto.findUnique({
      where: { id: params.id },
      include: { colaboradores: { where: { ativo: true }, orderBy: { nome: "asc" } } },
    })

    if (!projeto) return Response.json({ erro: "Projeto não encontrado" }, { status: 404 })

    return Response.json({ dados: projeto }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar projeto:", erro)
    return Response.json({ erro: "Erro ao buscar projeto" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { nome, tecnologia } = corpo

    if (!nome?.trim() || !tecnologia?.trim()) {
      return Response.json({ erro: "Nome e tecnologia são obrigatórios" }, { status: 400 })
    }

    const projeto = await prisma.projeto.update({
      where: { id: params.id },
      data: { nome: nome.trim(), tecnologia: tecnologia.trim() },
    })

    return Response.json({ dados: projeto }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao atualizar projeto:", erro)
    return Response.json({ erro: "Erro ao atualizar projeto" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const colaboradoresVinculados = await prisma.colaborador.count({
      where: { projetoId: params.id },
    })

    if (colaboradoresVinculados > 0) {
      return Response.json(
        { erro: "Não é possível excluir um projeto com colaboradores vinculados" },
        { status: 400 }
      )
    }

    await prisma.projeto.delete({ where: { id: params.id } })

    return Response.json({ dados: null }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao excluir projeto:", erro)
    return Response.json({ erro: "Erro ao excluir projeto" }, { status: 500 })
  }
}
