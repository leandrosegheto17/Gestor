import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { TipoOcorrencia } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const colaboradorId = searchParams.get("colaboradorId")
    const tipo = searchParams.get("tipo")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    const ocorrencias = await prisma.ocorrencia.findMany({
      where: {
        ...(colaboradorId ? { colaboradorId } : {}),
        ...(tipo ? { tipo: tipo as TipoOcorrencia } : {}),
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

    return Response.json({ dados: ocorrencias }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar ocorrências:", erro)
    return Response.json({ erro: "Erro ao buscar ocorrências" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        colaboradorId,
        data: new Date(data),
        tipo: tipo as TipoOcorrencia,
        gravidade: gravidadeNum,
        descricao: descricao.trim(),
      },
      include: {
        colaborador: { select: { id: true, nome: true } },
      },
    })

    return Response.json({ dados: ocorrencia }, { status: 201 })
  } catch (erro) {
    console.error("Erro ao criar ocorrência:", erro)
    return Response.json({ erro: "Erro ao criar ocorrência" }, { status: 500 })
  }
}
