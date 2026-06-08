import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

export async function GET() {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const projetos = await prisma.projeto.findMany({
      include: {
        _count: { select: { colaboradores: true } },
      },
      orderBy: { nome: "asc" },
    })

    return Response.json({ dados: projetos }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro)
    return Response.json({ erro: "Erro ao buscar projetos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { nome, tecnologia } = corpo

    if (!nome?.trim() || !tecnologia?.trim()) {
      return Response.json({ erro: "Nome e tecnologia são obrigatórios" }, { status: 400 })
    }

    const projeto = await prisma.projeto.create({
      data: { nome: nome.trim(), tecnologia: tecnologia.trim() },
    })

    return Response.json({ dados: projeto }, { status: 201 })
  } catch (erro) {
    console.error("Erro ao criar projeto:", erro)
    return Response.json({ erro: "Erro ao criar projeto" }, { status: 500 })
  }
}
