# CLAUDE.md — Gestor de Times

Guia de desenvolvimento para o assistente de IA. Leia este arquivo antes de qualquer tarefa de código.

---

## 1. Sobre o Projeto

Aplicação web local para gestão de times de tecnologia com 40+ colaboradores. Cobre projetos, colaboradores, organograma, feedbacks, ocorrências, movimentação salarial, planilha salarial e férias. Roda 100% localmente via Docker Compose. Um único usuário (gestor), autenticado por usuário/senha mestre configurados em `.env`.

- **Repositório:** https://github.com/leandrosegheto17/Gestor
- **PRD completo:** `PRD.md`
- **Descrição inicial:** `descricao-projeto.txt`

---

## 2. Stack e Versões

| Tecnologia | Versão | Finalidade |
|-----------|--------|-----------|
| Next.js | 14+ | Framework fullstack (App Router) |
| TypeScript | 5+ | Tipagem estática |
| PostgreSQL | 16 | Banco de dados |
| Prisma | 5+ | ORM |
| NextAuth.js | 4+ | Autenticação |
| Tailwind CSS | 3+ | Estilo |
| shadcn/ui | latest | Componentes de UI |
| Recharts | 2+ | Gráficos (painel de indicadores) |
| react-organizational-chart | latest | Organograma |
| Docker | 24+ | Containers |
| Docker Compose | 2+ | Orquestração |
| Node.js | 20+ | Runtime |

---

## 3. Estrutura de Pastas

```
gestor/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx            # página de login
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # sidebar + header (protegido)
│   │   │   ├── page.tsx                # /  → painel de indicadores
│   │   │   ├── projetos/
│   │   │   │   └── page.tsx
│   │   │   ├── colaboradores/
│   │   │   │   └── page.tsx
│   │   │   ├── organograma/
│   │   │   │   └── page.tsx
│   │   │   ├── feedbacks/
│   │   │   │   └── page.tsx
│   │   │   ├── ocorrencias/
│   │   │   │   └── page.tsx
│   │   │   ├── salario/
│   │   │   │   ├── movimentacoes/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── planilha/
│   │   │   │       └── page.tsx
│   │   │   └── ferias/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── projetos/
│   │       │   ├── route.ts            # GET (listar) + POST (criar)
│   │       │   └── [id]/
│   │       │       └── route.ts        # GET + PUT + DELETE
│   │       ├── colaboradores/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── organograma/
│   │       │   └── route.ts            # GET (árvore hierárquica)
│   │       ├── feedbacks/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── ocorrencias/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── movimentacoes-salariais/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── salario/
│   │       │   └── planilha/
│   │       │       └── route.ts        # GET (dados consolidados)
│   │       ├── ferias/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── indicadores/
│   │           └── route.ts            # GET (dados do painel)
│   ├── components/
│   │   ├── ui/                         # componentes shadcn/ui (não editar manualmente)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── projetos/
│   │   ├── colaboradores/
│   │   ├── organograma/
│   │   ├── feedbacks/
│   │   ├── ocorrencias/
│   │   ├── salario/
│   │   └── ferias/
│   ├── lib/
│   │   ├── prisma.ts                   # singleton do Prisma Client
│   │   ├── autenticacao.ts             # configuração do NextAuth
│   │   └── utils.ts                    # funções utilitárias compartilhadas
│   └── types/
│       └── index.ts                    # tipos TypeScript compartilhados
├── prisma/
│   ├── schema.prisma                   # schema completo (ver PRD.md seção 3)
│   ├── migrations/                     # gerado pelo Prisma — não editar manualmente
│   └── seed.ts                         # dados iniciais para desenvolvimento
├── public/
├── Dockerfile
├── docker-compose.yml
├── .env                                # NÃO commitar — contém credenciais reais
├── .env.example                        # commitar — contém exemplo sem valores reais
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Configuração do Ambiente

### 4.1 Pré-requisitos
- Docker Desktop instalado e rodando
- Git

### 4.2 Subindo do zero

```bash
# 1. Clonar o repositório
git clone https://github.com/leandrosegheto17/Gestor
cd Gestor

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Subir os containers
docker compose up --build

# 4. Em outro terminal, aplicar as migrations do banco
docker compose exec app npx prisma migrate deploy

# 5. (Opcional) Popular banco com dados de exemplo
docker compose exec app npx prisma db seed

# Acessar: http://localhost:3000
```

### 4.3 Variáveis de Ambiente (`.env`)

```env
# Banco de dados
DATABASE_URL="postgresql://gestor:senha123@db:5432/gestor_db"

# NextAuth — gerar com: openssl rand -base64 32
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Credenciais do gestor (usuário mestre)
GESTOR_USUARIO="admin"
GESTOR_SENHA="sua-senha-aqui"
```

### 4.4 `.env.example`

```env
DATABASE_URL="postgresql://gestor:SENHA@db:5432/gestor_db"
NEXTAUTH_SECRET="GERE_COM_openssl_rand_-base64_32"
NEXTAUTH_URL="http://localhost:3000"
GESTOR_USUARIO="admin"
GESTOR_SENHA="DEFINA_SUA_SENHA"
```

---

## 5. Comandos Úteis

| Ação | Comando |
|------|---------|
| Subir aplicação | `docker compose up` |
| Subir em background | `docker compose up -d` |
| Parar containers | `docker compose down` |
| Rebuild após mudança no Dockerfile | `docker compose up --build` |
| Ver logs da aplicação | `docker compose logs app -f` |
| Ver logs do banco | `docker compose logs db -f` |
| Abrir shell no container da app | `docker compose exec app sh` |
| Criar nova migration | `docker compose exec app npx prisma migrate dev --name nome-da-migration` |
| Aplicar migrations em produção | `docker compose exec app npx prisma migrate deploy` |
| Resetar banco (dev) | `docker compose exec app npx prisma migrate reset` |
| Abrir Prisma Studio | `docker compose exec app npx prisma studio` |
| Popular banco | `docker compose exec app npx prisma db seed` |
| Gerar Prisma Client | `docker compose exec app npx prisma generate` |

---

## 6. Convenções de Código

### 6.1 Idioma
Todo o código é escrito em **português**: nomes de variáveis, funções, componentes, arquivos, comentários e tipos TypeScript. Exceções: nomes de bibliotecas externas, props do Next.js/React (`children`, `params`, `searchParams`), e atributos HTML.

```typescript
// Correto
const [projetos, setProjetos] = useState<Projeto[]>([])
async function buscarProjetos() { ... }
function CartaoColaborador({ colaborador }: CartaoColaboradorProps) { ... }

// Incorreto
const [projects, setProjects] = useState<Project[]>([])
async function fetchProjects() { ... }
```

### 6.2 Nomes de Arquivos
- **Componentes:** PascalCase — `ListaProjetos.tsx`, `FormularioColaborador.tsx`
- **Utilitários e lib:** camelCase — `prisma.ts`, `autenticacao.ts`
- **Páginas e rotas:** lowercase com hífen (Next.js App Router) — `page.tsx`, `route.ts`

### 6.3 Estrutura de API Routes

Cada módulo segue o padrão:
```
api/{modulo}/route.ts       → GET (listar com filtros) + POST (criar)
api/{modulo}/[id]/route.ts  → GET (detalhar) + PUT (editar) + DELETE (excluir)
```

Padrão de resposta:
```typescript
// Sucesso
return Response.json({ dados: resultado }, { status: 200 })
return Response.json({ dados: novoItem }, { status: 201 })

// Erro
return Response.json({ erro: "Mensagem de erro" }, { status: 400 })
return Response.json({ erro: "Não encontrado" }, { status: 404 })
return Response.json({ erro: "Erro interno" }, { status: 500 })
```

Padrão de tratamento de erros:
```typescript
export async function GET(request: Request) {
  try {
    const dados = await prisma.projeto.findMany()
    return Response.json({ dados }, { status: 200 })
  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro)
    return Response.json({ erro: "Erro ao buscar projetos" }, { status: 500 })
  }
}
```

### 6.4 Singleton do Prisma Client

Sempre importar de `@/lib/prisma`:
```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### 6.5 Componentes de UI
- Usar sempre componentes do shadcn/ui quando disponíveis
- Nunca editar arquivos em `src/components/ui/` manualmente — usar `npx shadcn@latest add <componente>`
- Componentes de feature ficam em `src/components/{modulo}/`

---

## 7. Autenticação

### 7.1 Configuração (NextAuth Credentials)

```typescript
// src/lib/autenticacao.ts
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"

export const opcoesAutenticacao: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        usuario: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        if (
          credenciais?.usuario === process.env.GESTOR_USUARIO &&
          credenciais?.senha === process.env.GESTOR_SENHA
        ) {
          return { id: "1", name: "Gestor" }
        }
        return null
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
}
```

### 7.2 Proteção de Rotas (Middleware)

```typescript
// src/middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({ pages: { signIn: "/login" } })

export const config = {
  matcher: ["/((?!login|api/auth|_next|favicon.ico).*)"],
}
```

### 7.3 Verificação de Sessão em Server Components

```typescript
import { getServerSession } from "next-auth"
import { opcoesAutenticacao } from "@/lib/autenticacao"
import { redirect } from "next/navigation"

const sessao = await getServerSession(opcoesAutenticacao)
if (!sessao) redirect("/login")
```

---

## 8. Banco de Dados

### 8.1 Criando uma Nova Migration

Após alterar `prisma/schema.prisma`:
```bash
docker compose exec app npx prisma migrate dev --name descricao-da-mudanca
```

### 8.2 Usando o Prisma Client

Em API Routes e Server Components:
```typescript
import { prisma } from "@/lib/prisma"

// Nunca instanciar PrismaClient diretamente — sempre usar o singleton
const projetos = await prisma.projeto.findMany({
  include: { colaboradores: true },
  orderBy: { nome: "asc" },
})
```

### 8.3 Convenções do Schema
- IDs: `@id @default(cuid())`
- Timestamps: `criadoEm DateTime @default(now())` e `atualizadoEm DateTime @updatedAt`
- Campos opcionais marcados com `?`
- Enums em SNAKE_CASE_MAIUSCULO

---

## 9. Fases do Projeto

Consultar `PRD.md` para detalhes completos de cada fase.

| Fase | Módulos |
|------|---------|
| 1 | Fundação: Docker + Next.js + Prisma + NextAuth + Layout |
| 2 | Estrutura do Time: Projetos + Colaboradores + Organograma |
| 3 | Gestão de Pessoas: Feedbacks + Ocorrências |
| 4 | Gestão Financeira: Movimentação Salarial + Planilha |
| 5 | Operações: Controle de Férias |
| 6 | Inteligência: Painel de Indicadores |

Implementar sempre uma fase completa antes de avançar para a próxima.
