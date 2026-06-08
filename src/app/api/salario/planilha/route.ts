import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const cicloAno = searchParams.get("cicloAno")
    const cicloMes = searchParams.get("cicloMes")

    // Ciclos disponíveis para o seletor
    const ciclosRaw = await prisma.movimentacaoSalarial.findMany({
      select: { cicloAno: true, cicloMes: true },
      distinct: ["cicloAno", "cicloMes"],
      orderBy: [{ cicloAno: "desc" }, { cicloMes: "desc" }],
    })
    const ciclosDisponiveis = ciclosRaw.map((c) => ({ ano: c.cicloAno, mes: c.cicloMes }))

    // Colaboradores ativos com movimentação do ciclo selecionado (ou a mais recente)
    const whereCiclo =
      cicloAno && cicloMes
        ? { cicloAno: Number(cicloAno), cicloMes: Number(cicloMes) }
        : {}

    const colaboradores = await prisma.colaborador.findMany({
      where: { ativo: true },
      include: {
        projeto: { select: { id: true, nome: true } },
        movimentacoes: {
          where: whereCiclo,
          orderBy: [{ cicloAno: "desc" }, { cicloMes: "desc" }],
          take: 1,
        },
      },
      orderBy: { nome: "asc" },
    })

    const itens = colaboradores.map((c) => {
      const mov = c.movimentacoes[0] ?? null
      return {
        colaborador: {
          id: c.id,
          nome: c.nome,
          funcao: c.funcao,
          senioridade: c.senioridade,
          projeto: c.projeto,
        },
        movimentacao: mov
          ? {
              id: mov.id,
              salarioAtual: Number(mov.salarioAtual),
              fatorReajuste: Number(mov.fatorReajuste),
              salarioProposto: Number(mov.salarioProposto),
              status: mov.status,
              cicloAno: mov.cicloAno,
              cicloMes: mov.cicloMes,
            }
          : null,
      }
    })

    const comDados = itens.filter((i) => i.movimentacao !== null)
    const totalAtual = comDados.reduce((acc, i) => acc + (i.movimentacao?.salarioAtual ?? 0), 0)
    const totalProposto = comDados.reduce(
      (acc, i) => acc + (i.movimentacao?.salarioProposto ?? 0),
      0
    )
    const diferenca = totalProposto - totalAtual
    const percentualMedio = totalAtual > 0 ? (diferenca / totalAtual) * 100 : 0

    return Response.json(
      {
        dados: {
          itens,
          totais: { totalAtual, totalProposto, diferenca, percentualMedio },
          ciclosDisponiveis,
        },
      },
      { status: 200 }
    )
  } catch (erro) {
    console.error("Erro ao buscar planilha:", erro)
    return Response.json({ erro: "Erro ao buscar planilha salarial" }, { status: 500 })
  }
}
