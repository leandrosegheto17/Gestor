import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { Senioridade } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projetoId = searchParams.get("projetoId")
    const senioridade = searchParams.get("senioridade")
    const funcao = searchParams.get("funcao")
    const ativoParam = searchParams.get("ativo")

    const colaboradores = await prisma.colaborador.findMany({
      where: {
        ...(projetoId ? { projetoId } : {}),
        ...(senioridade ? { senioridade: senioridade as Senioridade } : {}),
        ...(funcao ? { funcao: { contains: funcao, mode: "insensitive" } } : {}),
        ...(ativoParam !== null ? { ativo: ativoParam === "true" } : {}),
      },
      include: {
        projeto: { select: { id: true, nome: true } },
        lider: { select: { id: true, nome: true } },
      },
      orderBy: { nome: "asc" },
    })

    return Response.json({ dados: colaboradores }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar colaboradores:", erro)
    return Response.json({ erro: "Erro ao buscar colaboradores" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const corpo = await request.json()
    const { nome, usuario, funcao, senioridade, projetoId, liderId, ativo } = corpo

    if (!nome?.trim() || !usuario?.trim() || !funcao?.trim() || !senioridade) {
      return Response.json({ erro: "Campos obrigatórios: nome, usuário, função e senioridade" }, { status: 400 })
    }

    const colaborador = await prisma.colaborador.create({
      data: {
        nome: nome.trim(),
        usuario: usuario.trim(),
        funcao: funcao.trim(),
        senioridade,
        ativo: ativo ?? true,
        projetoId: projetoId || null,
        liderId: liderId || null,
      },
      include: {
        projeto: { select: { id: true, nome: true } },
        lider: { select: { id: true, nome: true } },
      },
    })

    return Response.json({ dados: colaborador }, { status: 201 })
  } catch (erro: unknown) {
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      (erro as { code: string }).code === "P2002"
    ) {
      return Response.json({ erro: "Já existe um colaborador com este usuário" }, { status: 400 })
    }
    console.error("Erro ao criar colaborador:", erro)
    return Response.json({ erro: "Erro ao criar colaborador" }, { status: 500 })
  }
}
