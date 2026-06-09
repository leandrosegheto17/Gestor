import { PrismaClient, Senioridade } from "@prisma/client"

const prisma = new PrismaClient()

// ─── Faixas salariais (mercado BR tech 2025, CLT) ────────────────────────────

const FAIXAS: Record<Senioridade, { min: number; max: number }> = {
  JUNIOR:    { min:  2_500, max:  4_200 },
  PLENO:     { min:  5_000, max:  8_500 },
  SENIOR:    { min:  9_000, max: 13_500 },
  STAFF:     { min: 14_000, max: 20_000 },
  PRINCIPAL: { min: 20_000, max: 30_000 },
}

function salarioAleatorio(senioridade: Senioridade): number {
  const { min, max } = FAIXAS[senioridade]
  const raw = min + Math.random() * (max - min)
  return Math.round(raw / 100) * 100 // arredonda para centenas
}

async function main() {
  const colaboradores = await prisma.colaborador.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, senioridade: true },
  })

  if (colaboradores.length === 0) {
    console.log("Nenhum colaborador encontrado. Rode o script popular.ts primeiro.")
    return
  }

  // Limpar movimentações existentes
  await prisma.movimentacaoSalarial.deleteMany()

  console.log(`Atribuindo salários a ${colaboradores.length} colaboradores...\n`)

  for (const colab of colaboradores) {
    const salario = salarioAleatorio(colab.senioridade)

    await prisma.movimentacaoSalarial.create({
      data: {
        colaboradorId: colab.id,
        salarioAtual: salario,
        fatorReajuste: 0,
        salarioProposto: salario,
        status: "APLICADA",
        observacoes: "Salário inicial",
        cicloAno: 2025,
        cicloMes: 1,
      },
    })

    const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    console.log(`  ${colab.nome.padEnd(24)} [${colab.senioridade.padEnd(9)}] → ${fmt.format(salario)}`)
  }

  console.log("\nConcluído.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
