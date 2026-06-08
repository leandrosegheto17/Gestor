import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { TipoOcorrencia } from "@prisma/client"

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const ocorrencia = await prisma.ocorrencia.findUnique({
      where: { id: params.id },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    if (!ocorrencia) return Response.json({ erro: "Ocorrência não encontrada" }, { status: 404 })

    return Response.json({ dados: ocorrencia }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar ocorrência:", erro)
    return Response.json({ erro: "Erro ao buscar ocorrência" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, data, tipo, gravidade, descricao } = corpo

    if (!colaboradorId || !data || !tipo || !gravidade || !descricao?.trim()) {
      return Response.json({ erro: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const gravidadeNum = Number(gravidade)
    if (gravidadeNum < 1 || gravidadeNum > 5) {
      return Response.json({ erro: "Gravidade deve ser entre 1 e 5" }, { status: 400 })
    }

    const ocorrencia = await prisma.ocorrencia.update({
      where: { id: params.id },
      data: {
        colaboradorId,
        data: new Date(data),
        tipo: tipo as TipoOcorrencia,
        gravidade: gravidadeNum,
        descricao: descricao.trim(),
      },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    return Response.json({ dados: ocorrencia }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao atualizar ocorrência:", erro)
    return Response.json({ erro: "Erro ao atualizar ocorrência" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    await prisma.ocorrencia.delete({ where: { id: params.id } })

    return Response.json({ dados: null }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao excluir ocorrência:", erro)
    return Response.json({ erro: "Erro ao excluir ocorrência" }, { status: 500 })
  }
}
