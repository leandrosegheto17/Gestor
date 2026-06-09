import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { calcularPontosFeedback, calcularPontosOcorrencia } from "@/lib/pontuacao"

export async function GET() {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const colaboradores = await prisma.colaborador.findMany({
      where: { ativo: true },
      include: {
        projeto: { select: { id: true, nome: true } },
        feedbacks: { select: { tipo: true, fonte: true } },
        ocorrencias: { select: { tipo: true, gravidade: true } },
      },
      orderBy: { nome: "asc" },
    })

    const itens = colaboradores.map((c) => {
      const pontosFeedback = c.feedbacks.reduce(
        (acc, f) => acc + calcularPontosFeedback(f.tipo, f.fonte),
        0
      )
      const pontosOcorrencia = c.ocorrencias.reduce(
        (acc, o) => acc + calcularPontosOcorrencia(o.tipo, o.gravidade),
        0
      )
      const pontuacaoTotal = pontosFeedback + pontosOcorrencia

      const feedbacksPositivos  = c.feedbacks.filter((f) => f.tipo === "POSITIVO").length
      const feedbacksConstrutivos = c.feedbacks.filter((f) => f.tipo === "CONSTRUTIVO").length
      const ocorrenciasPositivas = c.ocorrencias.filter((o) => o.tipo === "POSITIVA").length
      const ocorrenciasNegativas = c.ocorrencias.filter((o) => o.tipo === "NEGATIVA").length

      return {
        id: c.id,
        nome: c.nome,
        funcao: c.funcao,
        senioridade: c.senioridade,
        projeto: c.projeto,
        pontuacaoTotal,
        pontosFeedback,
        pontosOcorrencia,
        totalFeedbacks: c.feedbacks.length,
        totalOcorrencias: c.ocorrencias.length,
        feedbacksPositivos,
        feedbacksConstrutivos,
        ocorrenciasPositivas,
        ocorrenciasNegativas,
      }
    })

    // Ordenar por pontuação decrescente
    itens.sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal)

    const pontuacoes = itens.map((i) => i.pontuacaoTotal)
    const resumo = {
      totalColaboradores: itens.length,
      mediaPontuacao: itens.length > 0 ? Math.round(pontuacoes.reduce((a, b) => a + b, 0) / itens.length) : 0,
      melhorPontuacao: pontuacoes.length > 0 ? Math.max(...pontuacoes) : 0,
      piorPontuacao: pontuacoes.length > 0 ? Math.min(...pontuacoes) : 0,
      acimaDaMedia: pontuacoes.filter((p) => p > (pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length)).length,
    }

    return Response.json({ dados: { itens, resumo } })
  } catch (erro) {
    console.error("Erro ao buscar ranking de desempenho:", erro)
    return Response.json({ erro: "Erro ao buscar desempenho" }, { status: 500 })
  }
}
