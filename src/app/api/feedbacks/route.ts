import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { TipoFeedback, FonteFeedback } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const colaboradorId = searchParams.get("colaboradorId")
    const tipo = searchParams.get("tipo")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    const feedbacks = await prisma.feedback.findMany({
      where: {
        ...(colaboradorId ? { colaboradorId } : {}),
        ...(tipo ? { tipo: tipo as TipoFeedback } : {}),
        ...(dataInicio || dataFim
          ? {
              data: {
                ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
                ...(dataFim ? { lte: new Date(dataFim + "T23:59:59") } : {}),
              },
            }
          : {}),
      },
      include: {
        colaborador: { select: { id: true, nome: true } },
      },
      orderBy: { data: "desc" },
    })

    return Response.json({ dados: feedbacks }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar feedbacks:", erro)
    return Response.json({ erro: "Erro ao buscar feedbacks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, data, tipo, fonte, descricao } = corpo

    if (!colaboradorId || !data || !tipo || !fonte || !descricao?.trim()) {
      return Response.json(
        { erro: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        colaboradorId,
        data: new Date(data),
        tipo: tipo as TipoFeedback,
        fonte: fonte as FonteFeedback,
        descricao: descricao.trim(),
      },
      include: {
        colaborador: { select: { id: true, nome: true } },
      },
    })

    return Response.json({ dados: feedback }, { status: 201 })
  } catch (erro) {
    console.error("Erro ao criar feedback:", erro)
    return Response.json({ erro: "Erro ao criar feedback" }, { status: 500 })
  }
}
