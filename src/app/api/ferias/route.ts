import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { StatusFerias } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const colaboradorId = searchParams.get("colaboradorId")
    const status = searchParams.get("status")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    const ferias = await prisma.ferias.findMany({
      where: {
        ...(colaboradorId ? { colaboradorId } : {}),
        ...(status ? { status: status as StatusFerias } : {}),
        // Férias que se sobrepõem ao intervalo consultado
        ...(dataInicio || dataFim
          ? {
              AND: [
                ...(dataFim ? [{ dataInicio: { lte: new Date(dataFim + "T23:59:59") } }] : []),
                ...(dataInicio ? [{ dataFim: { gte: new Date(dataInicio) } }] : []),
              ],
            }
          : {}),
      },
      include: {
        colaborador: { select: { id: true, nome: true } },
      },
      orderBy: { dataInicio: "asc" },
    })

    return Response.json({ dados: ferias }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar férias:", erro)
    return Response.json({ erro: "Erro ao buscar férias" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, dataInicio, dataFim, status, observacoes } = corpo

    if (!colaboradorId || !dataInicio || !dataFim) {
      return Response.json(
        { erro: "Colaborador, data de início e data de fim são obrigatórios" },
        { status: 400 }
      )
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      return Response.json(
        { erro: "A data de início deve ser anterior ou igual à data de fim" },
        { status: 400 }
      )
    }

    const ferias = await prisma.ferias.create({
      data: {
        colaboradorId,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        status: (status as StatusFerias) ?? "AGENDADA",
        observacoes: observacoes?.trim() || null,
      },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    return Response.json({ dados: ferias }, { status: 201 })
  } catch (erro) {
    console.error("Erro ao criar férias:", erro)
    return Response.json({ erro: "Erro ao criar férias" }, { status: 500 })
  }
}
