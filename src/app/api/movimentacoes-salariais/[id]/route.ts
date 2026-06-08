import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { StatusMovimentacao } from "@prisma/client"

interface Params {
  params: { id: string }
}

function serializar(m: {
  salarioAtual: { toNumber(): number } | number
  fatorReajuste: { toNumber(): number } | number
  salarioProposto: { toNumber(): number } | number
  [key: string]: unknown
}) {
  return {
    ...m,
    salarioAtual: typeof m.salarioAtual === "object" ? m.salarioAtual.toNumber() : m.salarioAtual,
    fatorReajuste: typeof m.fatorReajuste === "object" ? m.fatorReajuste.toNumber() : m.fatorReajuste,
    salarioProposto:
      typeof m.salarioProposto === "object" ? m.salarioProposto.toNumber() : m.salarioProposto,
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const mov = await prisma.movimentacaoSalarial.findUnique({
      where: { id: params.id },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    if (!mov) return Response.json({ erro: "Movimentação não encontrada" }, { status: 404 })

    return Response.json({ dados: serializar(mov) }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar movimentação:", erro)
    return Response.json({ erro: "Erro ao buscar movimentação" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, salarioAtual, fatorReajuste, status, observacoes, cicloAno, cicloMes } =
      corpo

    if (!colaboradorId || salarioAtual == null || fatorReajuste == null || !cicloAno || !cicloMes) {
      return Response.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    const salAtual = Number(salarioAtual)
    const fator = Number(fatorReajuste)
    const salProposto = salAtual * (1 + fator / 100)

    const mov = await prisma.movimentacaoSalarial.update({
      where: { id: params.id },
      data: {
        colaboradorId,
        salarioAtual: salAtual,
        fatorReajuste: fator,
        salarioProposto: salProposto,
        status: status as StatusMovimentacao,
        observacoes: observacoes?.trim() || null,
        cicloAno: Number(cicloAno),
        cicloMes: Number(cicloMes),
      },
      include: { colaborador: { select: { id: true, nome: true } } },
    })

    return Response.json({ dados: serializar(mov) }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao atualizar movimentação:", erro)
    return Response.json({ erro: "Erro ao atualizar movimentação" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    await prisma.movimentacaoSalarial.delete({ where: { id: params.id } })

    return Response.json({ dados: null }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao excluir movimentação:", erro)
    return Response.json({ erro: "Erro ao excluir movimentação" }, { status: 500 })
  }
}
