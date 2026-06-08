import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { StatusMovimentacao } from "@prisma/client"

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

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const colaboradorId = searchParams.get("colaboradorId")
    const status = searchParams.get("status")
    const cicloAno = searchParams.get("cicloAno")
    const cicloMes = searchParams.get("cicloMes")

    const movimentacoes = await prisma.movimentacaoSalarial.findMany({
      where: {
        ...(colaboradorId ? { colaboradorId } : {}),
        ...(status ? { status: status as StatusMovimentacao } : {}),
        ...(cicloAno ? { cicloAno: Number(cicloAno) } : {}),
        ...(cicloMes ? { cicloMes: Number(cicloMes) } : {}),
      },
      include: {
        colaborador: { select: { id: true, nome: true, funcao: true, senioridade: true } },
      },
      orderBy: [{ cicloAno: "desc" }, { cicloMes: "desc" }, { criadoEm: "desc" }],
    })

    return Response.json({ dados: movimentacoes.map(serializar) }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar movimentações:", erro)
    return Response.json({ erro: "Erro ao buscar movimentações" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { colaboradorId, salarioAtual, fatorReajuste, status, observacoes, cicloAno, cicloMes } =
      corpo

    if (!colaboradorId || salarioAtual == null || fatorReajuste == null || !cicloAno || !cicloMes) {
      return Response.json(
        { erro: "Colaborador, salário, fator de reajuste e ciclo são obrigatórios" },
        { status: 400 }
      )
    }

    const salAtual = Number(salarioAtual)
    const fator = Number(fatorReajuste)
    const salProposto = salAtual * (1 + fator / 100)

    const movimentacao = await prisma.movimentacaoSalarial.create({
      data: {
        colaboradorId,
        salarioAtual: salAtual,
        fatorReajuste: fator,
        salarioProposto: salProposto,
        status: (status as StatusMovimentacao) ?? "PENDENTE",
        observacoes: observacoes?.trim() || null,
        cicloAno: Number(cicloAno),
        cicloMes: Number(cicloMes),
      },
      include: {
        colaborador: { select: { id: true, nome: true, funcao: true, senioridade: true } },
      },
    })

    return Response.json({ dados: serializar(movimentacao) }, { status: 201 })
  } catch (erro) {
    console.error("Erro ao criar movimentação:", erro)
    return Response.json({ erro: "Erro ao criar movimentação" }, { status: 500 })
  }
}
