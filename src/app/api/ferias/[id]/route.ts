import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { StatusFerias } from "@prisma/client"

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const ferias = await prisma.ferias.findUnique({
      where: { id: params.id },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    if (!ferias) return Response.json({ erro: "Férias não encontradas" }, { status: 404 })

    return Response.json({ dados: ferias }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar férias:", erro)
    return Response.json({ erro: "Erro ao buscar férias" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, dataInicio, dataFim, status, observacoes } = corpo

    if (!colaboradorId || !dataInicio || !dataFim) {
      return Response.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      return Response.json(
        { erro: "A data de início deve ser anterior ou igual à data de fim" },
        { status: 400 }
      )
    }

    const ferias = await prisma.ferias.update({
      where: { id: params.id },
      data: {
        colaboradorId,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        status: status as StatusFerias,
        observacoes: observacoes?.trim() || null,
      },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    return Response.json({ dados: ferias }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao atualizar férias:", erro)
    return Response.json({ erro: "Erro ao atualizar férias" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    await prisma.ferias.delete({ where: { id: params.id } })

    return Response.json({ dados: null }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao excluir férias:", erro)
    return Response.json({ erro: "Erro ao excluir férias" }, { status: 500 })
  }
}
