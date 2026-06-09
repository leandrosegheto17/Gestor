import { PrismaClient, TipoFeedback, FonteFeedback, TipoOcorrencia } from "@prisma/client"

const prisma = new PrismaClient()

// ─── Pools de textos ─────────────────────────────────────────────────────────

const FEEDBACKS: Record<TipoFeedback, string[]> = {
  POSITIVO: [
    "Demonstrou excelente domínio técnico na resolução do incidente em produção, atuando com calma e foco.",
    "Entregou a feature dentro do prazo e com qualidade acima do esperado. Código bem estruturado e testado.",
    "Recebeu elogios do cliente pela comunicação clara e proativa durante o desenvolvimento.",
    "Tomou iniciativa para documentar os processos do time, facilitando o onboarding de novos membros.",
    "Colaborou ativamente com outro time durante o release crítico, garantindo a estabilidade do ambiente.",
    "Apresentou proposta de melhoria de arquitetura bem fundamentada e conduziu a discussão de forma madura.",
    "Manteve alta qualidade de entregas mesmo sob pressão de prazo no último sprint.",
    "Fez mentoria espontânea para colegas mais juniores, acelerando o crescimento deles.",
    "Identificou um bug crítico antes do deploy em produção, evitando impacto direto para os clientes.",
    "Sua postura colaborativa e disponibilidade elevaram o nível de engajamento do time.",
    "Assumiu responsabilidade além do escopo sem ser solicitado, demonstrando senso de dono.",
    "Trouxe uma solução elegante para um problema complexo que estava travando o time há semanas.",
    "Conduziu a revisão de código com didatismo, gerando aprendizado valioso para os mais jovens.",
    "Manteve a calma durante o incidente de sexta à noite e coordenou o rollback com precisão.",
    "Dedicação notável no ciclo: zero tasks com retrabalho e entregas antecipadas em três sprints seguidos.",
  ],
  CONSTRUTIVO: [
    "Precisa melhorar a comunicação sobre impedimentos — os atrasos poderiam ter sido evitados com mais antecedência.",
    "O código entregue carregava dívida técnica considerável. Importante reservar tempo para refatoração.",
    "Durante a sprint review ficou evidente que alguns critérios de aceite não foram bem compreendidos.",
    "Tem dificuldade em estimar prazos realistas. Sugiro revisar o processo de quebra de tarefas.",
    "Precisa ser mais criterioso na revisão de código antes de abrir PRs — vários pontos óbvios foram deixados.",
    "A entrega foi atrasada sem comunicação prévia ao time. Avisar com antecedência é fundamental.",
    "Precisa evoluir na autonomia para resolução de problemas antes de escalar para o líder.",
    "A qualidade dos testes deixou a desejar. Cenários de edge case não foram cobertos.",
    "Seria valioso participar mais ativamente das cerimônias de refinamento para melhorar o alinhamento técnico.",
    "O feedback recebido no code review não foi incorporado de forma consistente nas entregas seguintes.",
    "Há espaço para melhorar a clareza da documentação — comentários de código estão ausentes em trechos críticos.",
    "Percebemos falta de atenção no alinhamento de requisitos antes de iniciar a implementação.",
    "É importante que o colaborador compartilhe mais os aprendizados técnicos dentro do time.",
    "Há situações em que a comunicação com o cliente poderia ser mais objetiva e empática.",
  ],
  NEUTRO: [
    "Participação dentro do esperado para o ciclo. Sem pontos críticos a destacar.",
    "Entregou as tasks do sprint com desempenho consistente com o histórico.",
    "Alinhamento realizado sobre expectativas para o próximo ciclo.",
    "Reunião 1:1 de acompanhamento individual. Colaborador adaptado ao novo projeto.",
    "Conversa sobre metas do semestre. Ficou alinhado com as prioridades do time.",
    "Checkin de desenvolvimento: sem mudanças significativas no último período.",
    "Discussão sobre trilha de carreira. Colaborador está no caminho esperado para a senioridade.",
    "Revisão de objetivos do ciclo anterior. Metas parcialmente atingidas, dentro da média do time.",
  ],
}

interface OcorrenciaTemplate {
  descricao: string
  gravidade: number
}

const OCORRENCIAS: Record<TipoOcorrencia, OcorrenciaTemplate[]> = {
  POSITIVA: [
    { descricao: "Entregou o módulo de autenticação duas semanas antes do prazo, sem comprometer a qualidade.", gravidade: 2 },
    { descricao: "Recebeu elogio formal do cliente pela responsividade e qualidade no atendimento à demanda urgente.", gravidade: 3 },
    { descricao: "Identificou uma falha de segurança no sistema antes de chegar em produção e reportou imediatamente.", gravidade: 3 },
    { descricao: "Fez pair programming com um colega júnior por dois dias, contribuindo diretamente para a evolução dele.", gravidade: 1 },
    { descricao: "Auxiliou outro time em entrega crítica, mesmo sem ser escalado, demonstrando espírito de colaboração.", gravidade: 2 },
    { descricao: "Propôs e implementou uma otimização de query que reduziu o tempo de resposta da API em 40%.", gravidade: 3 },
    { descricao: "Assumiu a liderança técnica do sprint durante ausência do Tech Lead, sem impacto nas entregas.", gravidade: 3 },
    { descricao: "Realizou apresentação técnica voluntária sobre boas práticas de segurança em APIs REST.", gravidade: 1 },
    { descricao: "Recebeu menção positiva em reunião de stakeholders pelo cuidado com a experiência do usuário.", gravidade: 2 },
    { descricao: "Implementou cobertura de testes automatizados em módulo crítico que estava sem cobertura há meses.", gravidade: 2 },
    { descricao: "Documentou toda a arquitetura do sistema legado, facilitando o trabalho de novos membros do time.", gravidade: 2 },
    { descricao: "Reconhecimento público do gestor na all-hands por liderança técnica exemplar no trimestre.", gravidade: 3 },
    { descricao: "Dedicação além do horário durante a migração de banco de dados, garantindo zero downtime.", gravidade: 3 },
    { descricao: "Colega de equipe destacou a qualidade dos code reviews como um diferencial de aprendizado.", gravidade: 1 },
    { descricao: "Entrega antecipada da feature de relatórios possibilitou adiantamento do release para o cliente.", gravidade: 2 },
    { descricao: "Proatividade em mapear e eliminar débitos técnicos críticos sem task formal no backlog.", gravidade: 2 },
  ],
  NEGATIVA: [
    { descricao: "Reclamação de cliente: erro no cálculo de valores exibidos no relatório de faturamento em produção.", gravidade: 4 },
    { descricao: "Deploy realizado sem aprovação do PR pelo revisor designado, causando regressão em homologação.", gravidade: 3 },
    { descricao: "Ausência sem aviso prévio no dia de pico de demanda, sobrecarregando o restante do time.", gravidade: 3 },
    { descricao: "Bug crítico introduzido por ausência de testes unitários na funcionalidade de exportação de dados.", gravidade: 4 },
    { descricao: "Cliente relatou resposta lenta do suporte — ticket de prioridade alta ficou sem retorno por 48 horas.", gravidade: 4 },
    { descricao: "Código entregue sem revisão adequada apresentou vulnerabilidade em rota pública da API.", gravidade: 5 },
    { descricao: "Tom inadequado durante code review gerou conflito com colega, impactando o ambiente do time.", gravidade: 3 },
    { descricao: "Entrega atrasada em 5 dias úteis sem comunicação proativa ao gestor ou ao time.", gravidade: 3 },
    { descricao: "Erro de configuração no ambiente de staging causou falha nos testes automatizados por dois dias.", gravidade: 2 },
    { descricao: "Commit direto na branch main sem passar pelo processo de PR estabelecido pelo time.", gravidade: 2 },
    { descricao: "Funcionalidade entregue sem os critérios de aceite definidos, gerando retrabalho estimado em 3 dias.", gravidade: 3 },
    { descricao: "Baixo engajamento nas retrospectivas — últimas três sem contribuição ativa do colaborador.", gravidade: 2 },
    { descricao: "Erro de lógica no módulo de datas causou impacto em registros de outros colaboradores.", gravidade: 4 },
    { descricao: "Aprovação de código com bug de produção por falta de atenção no processo de code review.", gravidade: 4 },
    { descricao: "Reclamação interna: colaborador monopolizou discussões técnicas na planning sem ouvir o time.", gravidade: 2 },
    { descricao: "Falta de documentação na feature entregue travou a integração do time parceiro por dois dias.", gravidade: 3 },
    { descricao: "Incidente de produção originado por mudança não testada em ambiente de desenvolvimento.", gravidade: 5 },
    { descricao: "Prazo de task crítica descumprido sem qualquer sinalização de risco ao longo do sprint.", gravidade: 3 },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function dataAleatoria(mesesAtras: number): Date {
  const agora = new Date()
  const inicio = new Date(agora)
  inicio.setMonth(inicio.getMonth() - mesesAtras)
  const diff = agora.getTime() - inicio.getTime()
  return new Date(inicio.getTime() + Math.random() * diff)
}

function intAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const colaboradores = await prisma.colaborador.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
  })

  if (colaboradores.length === 0) {
    console.log("Nenhum colaborador encontrado.")
    return
  }

  console.log("Limpando feedbacks e ocorrências existentes...")
  await prisma.feedback.deleteMany()
  await prisma.ocorrencia.deleteMany()

  const FONTES: FonteFeedback[] = ["GESTOR", "LIDER_DIRETO", "COLEGA", "CLIENTE"]
  const TIPOS_FEEDBACK: TipoFeedback[] = ["POSITIVO", "CONSTRUTIVO", "NEUTRO"]
  // Distribuição ponderada: mais positivos que construtivos, poucos neutros
  const PESOS_FEEDBACK = [0.45, 0.40, 0.15]
  const TIPOS_OCORRENCIA: TipoOcorrencia[] = ["POSITIVA", "NEGATIVA"]

  let totalFeedbacks = 0
  let totalOcorrencias = 0

  console.log(`\nCriando registros para ${colaboradores.length} colaboradores...\n`)

  for (const colab of colaboradores) {
    const qtdFeedbacks    = intAleatorio(4, 6)
    const qtdOcorrencias  = intAleatorio(7, 10)

    // ── Feedbacks ──
    for (let i = 0; i < qtdFeedbacks; i++) {
      const rnd = Math.random()
      const tipo: TipoFeedback =
        rnd < PESOS_FEEDBACK[0] ? "POSITIVO"
        : rnd < PESOS_FEEDBACK[0] + PESOS_FEEDBACK[1] ? "CONSTRUTIVO"
        : "NEUTRO"

      const pool = FEEDBACKS[tipo]
      const descricao = aleatorio(pool)
      const fonte = aleatorio(FONTES)

      await prisma.feedback.create({
        data: {
          colaboradorId: colab.id,
          data: dataAleatoria(12),
          tipo,
          descricao,
          fonte,
        },
      })
      totalFeedbacks++
    }

    // ── Ocorrências ──
    // Distribuição: ~55% positivas, ~45% negativas
    for (let i = 0; i < qtdOcorrencias; i++) {
      const tipo: TipoOcorrencia = Math.random() < 0.55 ? "POSITIVA" : "NEGATIVA"
      const pool = OCORRENCIAS[tipo]
      const template = aleatorio(pool)

      await prisma.ocorrencia.create({
        data: {
          colaboradorId: colab.id,
          data: dataAleatoria(12),
          tipo,
          descricao: template.descricao,
          gravidade: template.gravidade,
        },
      })
      totalOcorrencias++
    }

    process.stdout.write(`  ✓ ${colab.nome.padEnd(26)} — ${qtdFeedbacks} feedbacks, ${qtdOcorrencias} ocorrências\n`)
  }

  console.log(`\nConcluído:`)
  console.log(`  Feedbacks criados:   ${totalFeedbacks}`)
  console.log(`  Ocorrências criadas: ${totalOcorrencias}`)
  console.log(`  Total de registros:  ${totalFeedbacks + totalOcorrencias}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
