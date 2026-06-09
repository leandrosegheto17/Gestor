import { PrismaClient, Senioridade } from "@prisma/client"

const prisma = new PrismaClient()

// ─── Definição dos times ──────────────────────────────────────────────────────

interface MembroTime {
  nome: string
  usuario: string
  funcao: string
  senioridade: Senioridade
  liderIndex: number | null // índice do líder dentro do mesmo array
}

interface DefiniçãoProjeto {
  nome: string
  tecnologia: string
  membros: MembroTime[]
}

const times: DefiniçãoProjeto[] = [
  {
    nome: "Legado",
    tecnologia: "Java / Spring Boot",
    membros: [
      { nome: "Rafael Monteiro",   usuario: "rafael.monteiro",   funcao: "Coordenador",       senioridade: "PRINCIPAL", liderIndex: null },
      { nome: "Camila Ferreira",   usuario: "camila.ferreira",   funcao: "Tech Lead",         senioridade: "STAFF",     liderIndex: 0    },
      { nome: "Lucas Barbosa",     usuario: "lucas.barbosa",     funcao: "Desenvolvedor",     senioridade: "SENIOR",    liderIndex: 1    },
      { nome: "Ana Silveira",      usuario: "ana.silveira",      funcao: "Desenvolvedor",     senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Pedro Costa",       usuario: "pedro.costa",       funcao: "Desenvolvedor",     senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Isabela Rocha",     usuario: "isabela.rocha",     funcao: "Desenvolvedor",     senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Mateus Cunha",      usuario: "mateus.cunha",      funcao: "Desenvolvedor",     senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Beatriz Nunes",     usuario: "beatriz.nunes",     funcao: "Desenvolvedor",     senioridade: "JUNIOR",    liderIndex: 4    },
    ],
  },
  {
    nome: "IA",
    tecnologia: "Python / TensorFlow",
    membros: [
      { nome: "Juliana Santos",    usuario: "juliana.santos",    funcao: "Coordenadora",      senioridade: "PRINCIPAL", liderIndex: null },
      { nome: "Rodrigo Alves",     usuario: "rodrigo.alves",     funcao: "Tech Lead",         senioridade: "STAFF",     liderIndex: 0    },
      { nome: "Fernanda Lima",     usuario: "fernanda.lima",     funcao: "Engenheira de ML",  senioridade: "SENIOR",    liderIndex: 1    },
      { nome: "Gabriel Souza",     usuario: "gabriel.souza",     funcao: "Cientista de Dados",senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Larissa Carvalho",  usuario: "larissa.carvalho",  funcao: "Cientista de Dados",senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Felipe Nascimento", usuario: "felipe.nascimento", funcao: "Analista de Dados", senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Mariana Vieira",    usuario: "mariana.vieira",    funcao: "Analista de Dados", senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Thiago Ribeiro",    usuario: "thiago.ribeiro",    funcao: "Analista de Dados", senioridade: "JUNIOR",    liderIndex: 4    },
    ],
  },
  {
    nome: "Web",
    tecnologia: "React / Next.js",
    membros: [
      { nome: "Adriana Pires",     usuario: "adriana.pires",     funcao: "Coordenadora",      senioridade: "PRINCIPAL", liderIndex: null },
      { nome: "Marcus Oliveira",   usuario: "marcus.oliveira",   funcao: "Tech Lead",         senioridade: "STAFF",     liderIndex: 0    },
      { nome: "Tatiana Cruz",      usuario: "tatiana.cruz",      funcao: "Desenvolvedora",    senioridade: "SENIOR",    liderIndex: 1    },
      { nome: "Diego Machado",     usuario: "diego.machado",     funcao: "Desenvolvedor",     senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Priscila Mendes",   usuario: "priscila.mendes",   funcao: "Desenvolvedora",    senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Eduardo Andrade",   usuario: "eduardo.andrade",   funcao: "Desenvolvedor",     senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Bianca Lopes",      usuario: "bianca.lopes",      funcao: "Desenvolvedora",    senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Victor Teixeira",   usuario: "victor.teixeira",   funcao: "Desenvolvedor",     senioridade: "JUNIOR",    liderIndex: 4    },
    ],
  },
  {
    nome: "Integração",
    tecnologia: "Node.js / REST APIs",
    membros: [
      { nome: "Roberto Cardoso",   usuario: "roberto.cardoso",   funcao: "Coordenador",       senioridade: "PRINCIPAL", liderIndex: null },
      { nome: "Vanessa Freitas",   usuario: "vanessa.freitas",   funcao: "Tech Lead",         senioridade: "STAFF",     liderIndex: 0    },
      { nome: "André Moreira",     usuario: "andre.moreira",     funcao: "Desenvolvedor",     senioridade: "SENIOR",    liderIndex: 1    },
      { nome: "Patricia Dias",     usuario: "patricia.dias",     funcao: "Desenvolvedora",    senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Henrique Castro",   usuario: "henrique.castro",   funcao: "Desenvolvedor",     senioridade: "PLENO",     liderIndex: 2    },
      { nome: "Aline Ramos",       usuario: "aline.ramos",       funcao: "Desenvolvedora",    senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Samuel Torres",     usuario: "samuel.torres",     funcao: "Desenvolvedor",     senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Carolina Gomes",    usuario: "carolina.gomes",    funcao: "Desenvolvedora",    senioridade: "JUNIOR",    liderIndex: 4    },
    ],
  },
  {
    nome: "Dados",
    tecnologia: "Apache Spark / dbt",
    membros: [
      { nome: "Marcelo Bastos",    usuario: "marcelo.bastos",    funcao: "Coordenador",       senioridade: "PRINCIPAL", liderIndex: null },
      { nome: "Claudia Faria",     usuario: "claudia.faria",     funcao: "Tech Lead",         senioridade: "STAFF",     liderIndex: 0    },
      { nome: "Leonardo Sousa",    usuario: "leonardo.sousa",    funcao: "Engenheiro de Dados",senioridade: "SENIOR",   liderIndex: 1    },
      { nome: "Daniela Correia",   usuario: "daniela.correia",   funcao: "Engenheira de Dados",senioridade: "PLENO",   liderIndex: 2    },
      { nome: "Alexandre Pereira", usuario: "alexandre.pereira", funcao: "Engenheiro de Dados",senioridade: "PLENO",   liderIndex: 2    },
      { nome: "Amanda Cavalcanti", usuario: "amanda.cavalcanti", funcao: "Analista de Dados", senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Bruno Miranda",     usuario: "bruno.miranda",     funcao: "Analista de Dados", senioridade: "JUNIOR",    liderIndex: 3    },
      { nome: "Natalia Prado",     usuario: "natalia.prado",     funcao: "Analista de Dados", senioridade: "JUNIOR",    liderIndex: 4    },
    ],
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Limpando dados existentes...")

  await prisma.ferias.deleteMany()
  await prisma.movimentacaoSalarial.deleteMany()
  await prisma.ocorrencia.deleteMany()
  await prisma.feedback.deleteMany()
  // Remover subordinados antes de líderes (FK)
  await prisma.colaborador.updateMany({ data: { liderId: null } })
  await prisma.colaborador.deleteMany()
  await prisma.projeto.deleteMany()

  console.log("Criando projetos e times...\n")

  for (const def of times) {
    const projeto = await prisma.projeto.create({
      data: { nome: def.nome, tecnologia: def.tecnologia },
    })

    // Criar colaboradores sem liderança primeiro
    const criados: { id: string }[] = []
    for (const m of def.membros) {
      const colab = await prisma.colaborador.create({
        data: {
          nome: m.nome,
          usuario: m.usuario,
          funcao: m.funcao,
          senioridade: m.senioridade,
          projetoId: projeto.id,
          ativo: true,
        },
      })
      criados.push(colab)
    }

    // Vincular lideranças
    for (let i = 0; i < def.membros.length; i++) {
      const liderIndex = def.membros[i].liderIndex
      if (liderIndex !== null) {
        await prisma.colaborador.update({
          where: { id: criados[i].id },
          data: { liderId: criados[liderIndex].id },
        })
      }
    }

    const nomes = def.membros.map((m) => `  • ${m.nome} (${m.funcao})`).join("\n")
    console.log(`✓ Projeto "${def.nome}" — ${def.membros.length} colaboradores\n${nomes}\n`)
  }

  const totalColabs = times.reduce((acc, t) => acc + t.membros.length, 0)
  console.log(`\nConcluído: ${times.length} projetos, ${totalColabs} colaboradores criados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
