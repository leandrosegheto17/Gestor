"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  GitBranch,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  FileSpreadsheet,
  Palmtree,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ItemMenu {
  titulo: string
  href: string
  icone: React.ComponentType<{ className?: string }>
  filhos?: ItemMenu[]
}

const itensMenu: ItemMenu[] = [
  {
    titulo: "Indicadores",
    href: "/",
    icone: LayoutDashboard,
  },
  {
    titulo: "Projetos",
    href: "/projetos",
    icone: FolderKanban,
  },
  {
    titulo: "Colaboradores",
    href: "/colaboradores",
    icone: Users,
  },
  {
    titulo: "Organograma",
    href: "/organograma",
    icone: GitBranch,
  },
  {
    titulo: "Feedbacks",
    href: "/feedbacks",
    icone: MessageSquare,
  },
  {
    titulo: "Ocorrências",
    href: "/ocorrencias",
    icone: AlertTriangle,
  },
  {
    titulo: "Salário",
    href: "/salario",
    icone: DollarSign,
    filhos: [
      {
        titulo: "Movimentações",
        href: "/salario/movimentacoes",
        icone: DollarSign,
      },
      {
        titulo: "Planilha",
        href: "/salario/planilha",
        icone: FileSpreadsheet,
      },
    ],
  },
  {
    titulo: "Férias",
    href: "/ferias",
    icone: Palmtree,
  },
]

function ItemMenuSidebar({ item }: { item: ItemMenu }) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(
    item.filhos?.some((filho) => pathname.startsWith(filho.href)) ?? false
  )

  const ativo = item.filhos
    ? item.filhos.some((filho) => pathname.startsWith(filho.href))
    : pathname === item.href

  if (item.filhos) {
    return (
      <div>
        <button
          onClick={() => setAberto(!aberto)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            ativo
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <item.icone className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.titulo}</span>
          {aberto ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        {aberto && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.filhos.map((filho) => (
              <Link
                key={filho.href}
                href={filho.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === filho.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {filho.titulo}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        ativo
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icone className="h-4 w-4 shrink-0" />
      {item.titulo}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">Gestor de Times</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {itensMenu.map((item) => (
          <ItemMenuSidebar key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )
}
