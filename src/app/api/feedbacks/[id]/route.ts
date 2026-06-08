import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { TipoFeedback, FonteFeedback } from "@prisma/client"

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    if (!feedback) return Response.json({ erro: "Feedback não encontrado" }, { status: 404 })

    return Response.json({ dados: feedback }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar feedback:", erro)
    return Response.json({ erro: "Erro ao buscar feedback" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, data, tipo, fonte, descricao } = corpo

    if (!colaboradorId || !data || !tipo || !fonte || !descricao?.trim()) {
      return Response.json({ erro: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        colaboradorId,
        data: new Date(data),
        tipo: tipo as TipoFeedback,
        fonte: fonte as FonteFeedback,
        descricao: descricao.trim(),
      },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    return Response.json({ dados: feedback }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao atualizar feedback:", erro)
    return Response.json({ erro: "Erro ao atualizar feedback" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    await prisma.feedback.delete({ where: { id: params.id } })

    return Response.json({ dados: null }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao excluir feedback:", erro)
    return Response.json({ erro: "Erro ao excluir feedback" }, { status: 500 })
  }
}
