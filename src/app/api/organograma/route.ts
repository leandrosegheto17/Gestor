import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"

interface NoColaborador {
  id: string
  nome: string
  funcao: string
  senioridade: string
  subordinados: NoColaborador[]
}

export async function GET() {
  try {
    const sessao = await getServerSession(opcoesAutenticacao)
    if (!sessao) return Response.json({ erro: "Não autorizado" }, { status: 401 })

    const colaboradores = await prisma.colaborador.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, funcao: true, senioridade: true, liderId: true },
      orderBy: { nome: "asc" },
    })

    const mapa = new Map<string, NoColaborador>(
      colaboradores.map((c) => [c.id, { ...c, subordinados: [] }])
    )

    const raizes: NoColaborador[] = []

    for (const colaborador of mapa.values()) {
      const no = colaborador as unknown as { liderId?: string | null } & NoColaborador
      if (!no.liderId || !mapa.has(no.liderId)) {
        raizes.push(colaborador)
      } else {
        mapa.get(no.liderId)!.subordinados.push(colaborador)
      }
    }

    return Response.json({ dados: raizes }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar organograma:", erro)
    return Response.json({ erro: "Erro ao buscar organograma" }, { status: 500 })
  }
}
