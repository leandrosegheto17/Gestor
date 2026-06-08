import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

const ROTULOS_SENIORIDADE: Record<string, string> = {
  JUNIOR: "Júnior",
  PLENO: "Pleno",
  SENIOR: "Sênior",
  STAFF: "Staff",
  PRINCIPAL: "Principal",
}

function gerarMesesNoPeriodo(inicio: Date, fim: Date): string[] {
  const meses: string[] = []
  const atual = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const limite = new Date(fim.getFullYear(), fim.getMonth(), 1)
  while (atual <= limite) {
    meses.push(
      `${atual.getFullYear()}-${String(atual.getMonth() + 1).padStart(2, "0")}`
    )
    atual.setMonth(atual.getMonth() + 1)
  }
  return meses
}

function formatarRotuloMes(chave: string): string {
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const [ano, mes] = chave.split("-")
  return `${MESES[Number(mes) - 1]}/${ano}`
}

function chaveDoMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const periodoMeses = Math.max(1, Math.min(24, Number(searchParams.get("periodoMeses") ?? "6")))

    const agora = new Date()
    const inicioperiodo = new Date(agora.getFullYear(), agora.getMonth() - periodoMeses + 1, 1)
    const em30Dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000)
    const ha90Dias = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Buscar tudo em paralelo
    const [
      totalAtivos,
      totalProjetos,
      colaboradoresAtivos,
      projetosComColabs,
      semProjeto,
      porSenioridade,
      feedbacksNoPeriodo,
      ocorrenciasNoPeriodo,
      feriasProximas,
      feedbacksRecentes,
    ] = await Promise.all([
      prisma.colaborador.count({ where: { ativo: true } }),
      prisma.projeto.count(),
      prisma.colaborador.findMany({
        where: { ativo: true },
        select: { id: true, nome: true, funcao: true },
      }),
      prisma.projeto.findMany({
        include: {
          _count: { select: { colaboradores: { where: { ativo: true } } } },
        },
        orderBy: { nome: "asc" },
      }),
      prisma.colaborador.count({ where: { ativo: true, projetoId: null } }),
      prisma.colaborador.groupBy({
        by: ["senioridade"],
        where: { ativo: true },
        _count: { id: true },
      }),
      prisma.feedback.findMany({
        where: { data: { gte: inicioperiodo } },
        select: { data: true, tipo: true },
      }),
      prisma.ocorrencia.findMany({
        where: { data: { gte: inicioperiodo } },
        select: { data: true, tipo: true },
      }),
      prisma.ferias.findMany({
        where: {
          status: { in: ["AGENDADA", "EM_CURSO"] },
          dataInicio: { lte: em30Dias },
          dataFim: { gte: agora },
        },
        include: { colaborador: { select: { id: true, nome: true } } },
        orderBy: { dataInicio: "asc" },
      }),
      prisma.feedback.findMany({
        where: { data: { gte: ha90Dias } },
        select: { colaboradorId: true },
        distinct: ["colaboradorId"],
      }),
    ])

    // ── Distribuição por senioridade ──────────────────────────────────────────
    const distribuicaoSenioridade = porSenioridade.map((s) => ({
      nome: ROTULOS_SENIORIDADE[s.senioridade] ?? s.senioridade,
      total: s._count.id,
    }))

    // ── Distribuição por projeto ──────────────────────────────────────────────
    const distribuicaoProjeto = [
      ...projetosComColabs
        .filter((p) => p._count.colaboradores > 0)
        .map((p) => ({ nome: p.nome, total: p._count.colaboradores }))
        .sort((a, b) => b.total - a.total),
      ...(semProjeto > 0 ? [{ nome: "Sem projeto", total: semProjeto }] : []),
    ]

    // ── Feedbacks por mês ─────────────────────────────────────────────────────
    const mesesNoPeriodo = gerarMesesNoPeriodo(inicioperiodo, agora)

    const mapaFeedbacks = new Map<
      string,
      { total: number; POSITIVO: number; CONSTRUTIVO: number; NEUTRO: number }
    >()
    for (const mes of mesesNoPeriodo) {
      mapaFeedbacks.set(mes, { total: 0, POSITIVO: 0, CONSTRUTIVO: 0, NEUTRO: 0 })
    }
    for (const f of feedbacksNoPeriodo) {
      const chave = chaveDoMes(new Date(f.data))
      const entrada = mapaFeedbacks.get(chave)
      if (entrada) {
        entrada.total++
        if (f.tipo === "POSITIVO") entrada.POSITIVO++
        else if (f.tipo === "CONSTRUTIVO") entrada.CONSTRUTIVO++
        else if (f.tipo === "NEUTRO") entrada.NEUTRO++
      }
    }

    const feedbacksPorMes = mesesNoPeriodo.map((mes) => {
      const d = mapaFeedbacks.get(mes)!
      return { mes: formatarRotuloMes(mes), ...d }
    })

    // ── Ocorrências por mês ───────────────────────────────────────────────────
    const mapaOcorrencias = new Map<string, { POSITIVA: number; NEGATIVA: number }>()
    for (const mes of mesesNoPeriodo) {
      mapaOcorrencias.set(mes, { POSITIVA: 0, NEGATIVA: 0 })
    }
    for (const o of ocorrenciasNoPeriodo) {
      const chave = chaveDoMes(new Date(o.data))
      const entrada = mapaOcorrencias.get(chave)
      if (entrada) {
        if (o.tipo === "POSITIVA") entrada.POSITIVA++
        else if (o.tipo === "NEGATIVA") entrada.NEGATIVA++
      }
    }

    const ocorrenciasPorMes = mesesNoPeriodo.map((mes) => ({
      mes: formatarRotuloMes(mes),
      ...mapaOcorrencias.get(mes)!,
    }))

    // ── Alertas: férias nos próximos 30 dias ──────────────────────────────────
    const alertasFerias = feriasProximas.map((f) => {
      const inicio = new Date(f.dataInicio)
      const diasRestantes = Math.max(
        0,
        Math.ceil((inicio.getTime() - agora.getTime()) / 86400000)
      )
      return {
        id: f.colaboradorId,
        nome: f.colaborador.nome,
        dataInicio: f.dataInicio.toISOString(),
        dataFim: f.dataFim.toISOString(),
        diasRestantes,
      }
    })

    // ── Alertas: sem feedback nos últimos 90 dias ─────────────────────────────
    const idsComFeedbackRecente = new Set(feedbacksRecentes.map((f) => f.colaboradorId))
    const alertasSemFeedback = colaboradoresAtivos
      .filter((c) => !idsComFeedbackRecente.has(c.id))
      .map((c) => ({ id: c.id, nome: c.nome, funcao: c.funcao }))

    return Response.json(
      {
        dados: {
          resumo: {
            totalAtivos,
            totalProjetos,
            totalFeedbacksNoPeriodo: feedbacksNoPeriodo.length,
            totalOcorrenciasNoPeriodo: ocorrenciasNoPeriodo.length,
          },
          distribuicaoSenioridade,
          distribuicaoProjeto,
          feedbacksPorMes,
          ocorrenciasPorMes,
          alertasFerias,
          alertasSemFeedback,
        },
      },
      { status: 200 }
    )
  } catch (erro) {
    console.error("Erro ao buscar indicadores:", erro)
    return Response.json({ erro: "Erro ao buscar indicadores" }, { status: 500 })
  }
}
