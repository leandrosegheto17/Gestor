import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { Senioridade } from "@prisma/client"

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const colaborador = await prisma.colaborador.findUnique({
      where: { id: params.id },
      include: {
        projeto: { select: { id: true, nome: true } },
        lider: { select: { id: true, nome: true } },
        subordinados: { select: { id: true, nome: true } },
      },
    })

    if (!colaborador) {
      return Response.json({ erro: "Colaborador não encontrado" }, { status: 404 })
    }

    return Response.json({ dados: colaborador }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar colaborador:", erro)
    return Response.json({ erro: "Erro ao buscar colaborador" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { nome, usuario, funcao, senioridade, projetoId, liderId, ativo } = corpo

    if (!nome?.trim() || !usuario?.trim() || !funcao?.trim() || !senioridade) {
      return Response.json({ erro: "Campos obrigatórios: nome, usuário, função e senioridade" }, { status: 400 })
    }

    const colaborador = await prisma.colaborador.update({
      where: { id: params.id },
      data: {
        nome: nome.trim(),
        usuario: usuario.trim(),
        funcao: funcao.trim(),
        senioridade: senioridade as Senioridade,
        ativo: ativo ?? true,
        projetoId: projetoId || null,
        liderId: liderId || null,
      },
      include: {
        projeto: { select: { id: true, nome: true } },
        lider: { select: { id: true, nome: true } },
      },
    })

    return Response.json({ dados: colaborador }, { status: 200 })
  } catch (erro: unknown) {
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      (erro as { code: string }).code === "P2002"
    ) {
      return Response.json({ erro: "Já existe um colaborador com este usuário" }, { status: 400 })
    }
    console.error("Erro ao atualizar colaborador:", erro)
    return Response.json({ erro: "Erro ao atualizar colaborador" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    await prisma.colaborador.delete({ where: { id: params.id } })

    return Response.json({ dados: null }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao excluir colaborador:", erro)
    return Response.json({ erro: "Erro ao excluir colaborador" }, { status: 500 })
  }
}
