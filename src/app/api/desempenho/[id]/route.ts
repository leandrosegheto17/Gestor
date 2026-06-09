import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { calcularPontosFeedback, calcularPontosOcorrencia } from "@/lib/pontuacao"

function chavesMes(mesesAtras: number): string[] {
  const chaves: string[] = []
  const agora = new Date()
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    chaves.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return chaves
}

function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split("-").map(Number)
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
}

function chaveDaData(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const colab = await prisma.colaborador.findUnique({
      where: { id: params.id },
      include: {
        projeto: { select: { id: true, nome: true, tecnologia: true } },
        lider: { select: { id: true, nome: true, funcao: true } },
        feedbacks: { orderBy: { data: "desc" } },
        ocorrencias: { orderBy: { data: "desc" } },
      },
    })

    if (!colab) return Response.json({ erro: "Colaborador não encontrado" }, { status: 404 })

    // ── Calcular pontuações ──
    const feedbacksComPontos = colab.feedbacks.map((f) => ({
      id: f.id,
      data: f.data,
      tipo: f.tipo,
      fonte: f.fonte,
      descricao: f.descricao,
      pontos: calcularPontosFeedback(f.tipo, f.fonte),
    }))

    const ocorrenciasComPontos = colab.ocorrencias.map((o) => ({
      id: o.id,
      data: o.data,
      tipo: o.tipo,
      gravidade: o.gravidade,
      descricao: o.descricao,
      pontos: calcularPontosOcorrencia(o.tipo, o.gravidade),
    }))

    const pontosFeedback   = feedbacksComPontos.reduce((acc, f) => acc + f.pontos, 0)
    const pontosOcorrencia = ocorrenciasComPontos.reduce((acc, o) => acc + o.pontos, 0)
    const pontuacaoTotal   = pontosFeedback + pontosOcorrencia

    // ── Evolução mensal (últimos 12 meses) ──
    const buckets = new Map<string, number>()
    for (const chave of chavesMes(12)) buckets.set(chave, 0)

    for (const f of feedbacksComPontos) {
      const chave = chaveDaData(new Date(f.data))
      if (buckets.has(chave)) buckets.set(chave, (buckets.get(chave) ?? 0) + f.pontos)
    }
    for (const o of ocorrenciasComPontos) {
      const chave = chaveDaData(new Date(o.data))
      if (buckets.has(chave)) buckets.set(chave, (buckets.get(chave) ?? 0) + o.pontos)
    }

    let acumulado = 0
    const evolucaoMensal = Array.from(buckets.entries()).map(([chave, pontosMes]) => {
      acumulado += pontosMes
      return { chave, rotulo: rotuloMes(chave), pontosMes, acumulado }
    })

    // ── Breakdown ──
    const breakdown = {
      feedbacksPositivos:    feedbacksComPontos.filter((f) => f.tipo === "POSITIVO").length,
      feedbacksConstrutivos: feedbacksComPontos.filter((f) => f.tipo === "CONSTRUTIVO").length,
      feedbacksNeutros:      feedbacksComPontos.filter((f) => f.tipo === "NEUTRO").length,
      ocorrenciasPositivas:  ocorrenciasComPontos.filter((o) => o.tipo === "POSITIVA").length,
      ocorrenciasNegativas:  ocorrenciasComPontos.filter((o) => o.tipo === "NEGATIVA").length,
    }

    return Response.json({
      dados: {
        colaborador: {
          id: colab.id,
          nome: colab.nome,
          usuario: colab.usuario,
          funcao: colab.funcao,
          senioridade: colab.senioridade,
          ativo: colab.ativo,
          projeto: colab.projeto,
          lider: colab.lider,
          criadoEm: colab.criadoEm,
        },
        pontuacaoTotal,
        pontosFeedback,
        pontosOcorrencia,
        feedbacks: feedbacksComPontos,
        ocorrencias: ocorrenciasComPontos,
        evolucaoMensal,
        breakdown,
      },
    })
  } catch (erro) {
    console.error("Erro ao buscar perfil de desempenho:", erro)
    return Response.json({ erro: "Erro ao buscar perfil" }, { status: 500 })
  }
}
