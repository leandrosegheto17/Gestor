import { PrismaClient, Senioridade } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Projetos
  const projetoPlataforma = await prisma.projeto.upsert({
    where: { id: "proj_plataforma" },
    update: {},
    create: {
      id: "proj_plataforma",
      nome: "Plataforma Core",
      tecnologia: "Node.js / React",
    },
  })

  const projetoMobile = await prisma.projeto.upsert({
    where: { id: "proj_mobile" },
    update: {},
    create: {
      id: "proj_mobile",
      nome: "App Mobile",
      tecnologia: "React Native",
    },
  })

  const projetoData = await prisma.projeto.upsert({
    where: { id: "proj_data" },
    update: {},
    create: {
      id: "proj_data",
      nome: "Data Platform",
      tecnologia: "Python / Spark",
    },
  })

  // Colaboradores — líderes primeiro
  const ana = await prisma.colaborador.upsert({
    where: { usuario: "ana.silva" },
    update: {},
    create: {
      nome: "Ana Silva",
      usuario: "ana.silva",
      funcao: "Engineering Manager",
      senioridade: Senioridade.STAFF,
      projetoId: projetoPlataforma.id,
    },
  })

  const carlos = await prisma.colaborador.upsert({
    where: { usuario: "carlos.mendes" },
    update: {},
    create: {
      nome: "Carlos Mendes",
      usuario: "carlos.mendes",
      funcao: "Tech Lead",
      senioridade: Senioridade.SENIOR,
      projetoId: projetoMobile.id,
      liderId: ana.id,
    },
  })

  const beatriz = await prisma.colaborador.upsert({
    where: { usuario: "beatriz.souza" },
    update: {},
    create: {
      nome: "Beatriz Souza",
      usuario: "beatriz.souza",
      funcao: "Tech Lead",
      senioridade: Senioridade.SENIOR,
      projetoId: projetoData.id,
      liderId: ana.id,
    },
  })

  await prisma.colaborador.upsert({
    where: { usuario: "diego.lima" },
    update: {},
    create: {
      nome: "Diego Lima",
      usuario: "diego.lima",
      funcao: "Engenheiro de Software",
      senioridade: Senioridade.PLENO,
      projetoId: projetoPlataforma.id,
      liderId: carlos.id,
    },
  })

  await prisma.colaborador.upsert({
    where: { usuario: "elena.costa" },
    update: {},
    create: {
      nome: "Elena Costa",
      usuario: "elena.costa",
      funcao: "Engenheira de Software",
      senioridade: Senioridade.JUNIOR,
      projetoId: projetoPlataforma.id,
      liderId: carlos.id,
    },
  })

  await prisma.colaborador.upsert({
    where: { usuario: "fabio.rocha" },
    update: {},
    create: {
      nome: "Fábio Rocha",
      usuario: "fabio.rocha",
      funcao: "Engenheiro de Dados",
      senioridade: Senioridade.PLENO,
      projetoId: projetoData.id,
      liderId: beatriz.id,
    },
  })

  console.log("Seed concluído com sucesso.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
