import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

// ─── Encargos CLT estimados (empresa paga sobre salário bruto) ───────────────
const INSS_PATRONAL      = 0.20
const FGTS               = 0.08
const DECIMO_TERCEIRO    = 0.0833  // 1 salário / 12 meses
const FERIAS_ADICIONAL   = 0.1111  // férias (8.33%) + 1/3 adicional = ÷ 12 ao mês
const SISTEMA_S          = 0.058   // SESC, SENAC, SENAI, SEBRAE, etc.
const RAT                = 0.02    // Risco de Acidente do Trabalho (grau médio)
const TOTAL_ENCARGOS = INSS_PATRONAL + FGTS + DECIMO_TERCEIRO + FERIAS_ADICIONAL + SISTEMA_S + RAT

// ─── Benefícios mensais fixos estimados (custo empresa, por colaborador) ─────
const VALE_REFEICAO    = 660   // R$ 30/dia × 22 dias
const VALE_TRANSPORTE  = 220   // líquido (após desconto de 6% do empregado)
const PLANO_SAUDE      = 800   // plano coletivo por titular
const TOTAL_BENEFICIOS = VALE_REFEICAO + VALE_TRANSPORTE + PLANO_SAUDE

function custoPorPessoa(salarioBruto: number) {
  const encargos  = salarioBruto * TOTAL_ENCARGOS
  const beneficios = TOTAL_BENEFICIOS
  return { encargos, beneficios, total: salarioBruto + encargos + beneficios }
}

export async function GET() {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    // Colaboradores ativos com salário mais recente e projeto
    const colaboradores = await prisma.colaborador.findMany({
      where: { ativo: true },
      include: {
        projeto: { select: { id: true, nome: true, tecnologia: true } },
        movimentacoes: {
          orderBy: [{ cicloAno: "desc" }, { cicloMes: "desc" }],
          take: 1,
        },
      },
    })

    // Agrupar por projeto
    const mapaProj = new Map<
      string,
      {
        id: string; nome: string; tecnologia: string
        membros: { senioridade: string; salario: number }[]
      }
    >()

    let totalFolhaBruta = 0
    let totalEncargos = 0
    let totalBeneficios = 0
    let totalCustoEmpresa = 0

    for (const c of colaboradores) {
      const salario = c.movimentacoes[0] ? Number(c.movimentacoes[0].salarioAtual) : 0
      const proj = c.projeto
      const chave = proj?.id ?? "__sem_projeto__"
      const nomeProjeto = proj?.nome ?? "Sem projeto"
      const tecnologia = proj?.tecnologia ?? ""

      if (!mapaProj.has(chave)) {
        mapaProj.set(chave, { id: chave, nome: nomeProjeto, tecnologia, membros: [] })
      }
      mapaProj.get(chave)!.membros.push({ senioridade: c.senioridade, salario })

      const custo = custoPorPessoa(salario)
      totalFolhaBruta    += salario
      totalEncargos      += custo.encargos
      totalBeneficios    += custo.beneficios
      totalCustoEmpresa  += custo.total
    }

    // Consolidar projetos
    const projetos = Array.from(mapaProj.values()).map((p) => {
      const folhaBruta = p.membros.reduce((s, m) => s + m.salario, 0)
      const encargos   = folhaBruta * TOTAL_ENCARGOS
      const beneficios = p.membros.length * TOTAL_BENEFICIOS
      const custoTotal = folhaBruta + encargos + beneficios

      // Agrupar por senioridade dentro do projeto
      const seniMap = new Map<string, { count: number; folha: number }>()
      for (const m of p.membros) {
        const entry = seniMap.get(m.senioridade) ?? { count: 0, folha: 0 }
        entry.count++
        entry.folha += m.salario
        seniMap.set(m.senioridade, entry)
      }

      const ORDEM_SENI = ["PRINCIPAL", "STAFF", "SENIOR", "PLENO", "JUNIOR"]
      const porSenioridade = ORDEM_SENI.filter((s) => seniMap.has(s)).map((s) => {
        const entry = seniMap.get(s)!
        const enc   = entry.folha * TOTAL_ENCARGOS
        const ben   = entry.count * TOTAL_BENEFICIOS
        return {
          senioridade: s,
          count: entry.count,
          folhaBruta: entry.folha,
          encargos: enc,
          beneficios: ben,
          custoTotal: entry.folha + enc + ben,
        }
      })

      return {
        id: p.id,
        nome: p.nome,
        tecnologia: p.tecnologia,
        headcount: p.membros.length,
        folhaBruta,
        encargos,
        beneficios,
        custoTotal,
        percentualDoTotal: totalCustoEmpresa > 0 ? (custoTotal / totalCustoEmpresa) * 100 : 0,
        porSenioridade,
      }
    })

    // Ordenar por custo decrescente
    projetos.sort((a, b) => b.custoTotal - a.custoTotal)

    // Detalhamento dos encargos sobre a folha total
    const encargosDetalhamento = {
      inssPatronal:        totalFolhaBruta * INSS_PATRONAL,
      fgts:                totalFolhaBruta * FGTS,
      decimoTerceiro:      totalFolhaBruta * DECIMO_TERCEIRO,
      feriasMaisAdicional: totalFolhaBruta * FERIAS_ADICIONAL,
      sistemaS:            totalFolhaBruta * SISTEMA_S,
      rat:                 totalFolhaBruta * RAT,
      valeRefeicao:        colaboradores.length * VALE_REFEICAO,
      valeTransporte:      colaboradores.length * VALE_TRANSPORTE,
      planoSaude:          colaboradores.length * PLANO_SAUDE,
    }

    return Response.json({
      dados: {
        resumo: {
          totalColaboradores: colaboradores.length,
          totalFolhaBruta,
          totalEncargos,
          totalBeneficios,
          totalCustoEmpresa,
          custoMedioPorPessoa: colaboradores.length > 0 ? totalCustoEmpresa / colaboradores.length : 0,
        },
        projetos,
        encargosDetalhamento,
        percentuaisEncargos: {
          inssPatronal:        INSS_PATRONAL       * 100,
          fgts:                FGTS                * 100,
          decimoTerceiro:      DECIMO_TERCEIRO      * 100,
          feriasMaisAdicional: FERIAS_ADICIONAL     * 100,
          sistemaS:            SISTEMA_S            * 100,
          rat:                 RAT                  * 100,
          totalSobreFolha:     TOTAL_ENCARGOS       * 100,
        },
        beneficiosFixos: {
          valeRefeicao:   VALE_REFEICAO,
          valeTransporte: VALE_TRANSPORTE,
          planoSaude:     PLANO_SAUDE,
          totalPorPessoa: TOTAL_BENEFICIOS,
        },
      },
    })
  } catch (erro) {
    console.error("Erro ao calcular custos:", erro)
    return Response.json({ erro: "Erro ao calcular custos por projeto" }, { status: 500 })
  }
}
