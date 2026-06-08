# PRD — Gestor de Times

**Versão:** 1.0  
**Data:** 2026-06-08  
**Repositório:** https://github.com/leandrosegheto17/Gestor

---

## 1. Visão Geral

### 1.1 Propósito
Gestor de Times é uma aplicação web local para gestores de tecnologia centralizarem, em uma única ferramenta, todas as informações operacionais e estratégicas do seu time — eliminando a dependência de planilhas dispersas e ferramentas desconectadas.

### 1.2 Problema Resolvido
- Informações de colaboradores espalhadas em múltiplas planilhas e sistemas
- Falta de visibilidade estruturada sobre a hierarquia e o organograma do time
- Ausência de histórico centralizado de feedbacks e ocorrências por colaborador
- Dificuldade em simular e documentar propostas de movimentação salarial
- Controle manual e propenso a erros sobre períodos de férias
- Falta de indicadores consolidados para tomada de decisão sobre o time

### 1.3 Usuário Alvo
- **Perfil:** Gestor de tecnologia (engenharia de software, dados ou produto)
- **Uso:** Individual, acesso protegido por usuário e senha mestre (configurados via `.env`)
- **Escala:** Times de 40 ou mais colaboradores
- **Frequência:** Diária a semanal, conforme ciclos de gestão

---

## 2. Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   │
│  │   container: app     │   │   container: db       │   │
│  │   Next.js 14+        │◄──│   PostgreSQL 16       │   │
│  │   porta 3000         │   │   porta 5432          │   │
│  │                      │   │   volume: postgres_data│  │
│  │  ┌────────────────┐  │   └──────────────────────┘   │
│  │  │  App Router    │  │                               │
│  │  │  (pages)       │  │                               │
│  │  ├────────────────┤  │                               │
│  │  │  API Routes    │  │                               │
│  │  │  (backend)     │  │                               │
│  │  ├────────────────┤  │                               │
│  │  │  Prisma ORM    │  │                               │
│  │  └────────────────┘  │                               │
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

**Stack:**
| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14+ com TypeScript |
| Banco de Dados | PostgreSQL 16 |
| ORM | Prisma |
| Autenticação | NextAuth.js (credentials provider) |
| Estilo | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Organograma | react-organizational-chart |
| Containers | Docker + Docker Compose |
| Idioma do código | Português |

---

## 3. Modelo de Dados

### 3.1 Schema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum Senioridade {
  JUNIOR
  PLENO
  SENIOR
  STAFF
  PRINCIPAL
}

enum TipoFeedback {
  POSITIVO
  CONSTRUTIVO
  NEUTRO
}

enum FonteFeedback {
  GESTOR
  LIDER_DIRETO
  COLEGA
  CLIENTE
}

enum TipoOcorrencia {
  POSITIVA
  NEGATIVA
}

enum StatusMovimentacao {
  PENDENTE
  APROVADA
  APLICADA
}

enum StatusFerias {
  AGENDADA
  EM_CURSO
  CONCLUIDA
}

// ─── Modelos ──────────────────────────────────────────────

model Projeto {
  id           String        @id @default(cuid())
  nome         String
  tecnologia   String
  criadoEm     DateTime      @default(now())
  atualizadoEm DateTime      @updatedAt
  colaboradores Colaborador[]
}

model Colaborador {
  id           String               @id @default(cuid())
  nome         String
  usuario      String               @unique
  funcao       String
  senioridade  Senioridade
  ativo        Boolean              @default(true)
  projetoId    String?
  projeto      Projeto?             @relation(fields: [projetoId], references: [id])
  liderId      String?
  lider        Colaborador?         @relation("LiderSubordinados", fields: [liderId], references: [id])
  subordinados Colaborador[]        @relation("LiderSubordinados")
  feedbacks    Feedback[]
  ocorrencias  Ocorrencia[]
  movimentacoes MovimentacaoSalarial[]
  ferias       Ferias[]
  criadoEm     DateTime             @default(now())
  atualizadoEm DateTime             @updatedAt
}

model Feedback {
  id             String        @id @default(cuid())
  colaboradorId  String
  colaborador    Colaborador   @relation(fields: [colaboradorId], references: [id])
  data           DateTime
  tipo           TipoFeedback
  descricao      String
  fonte          FonteFeedback
  criadoEm       DateTime      @default(now())
  atualizadoEm   DateTime      @updatedAt
}

model Ocorrencia {
  id             String         @id @default(cuid())
  colaboradorId  String
  colaborador    Colaborador    @relation(fields: [colaboradorId], references: [id])
  data           DateTime
  tipo           TipoOcorrencia
  descricao      String
  gravidade      Int            // 1 (baixa) a 5 (crítica)
  criadoEm       DateTime       @default(now())
  atualizadoEm   DateTime       @updatedAt
}

model MovimentacaoSalarial {
  id               String             @id @default(cuid())
  colaboradorId    String
  colaborador      Colaborador        @relation(fields: [colaboradorId], references: [id])
  salarioAtual     Decimal            @db.Decimal(10, 2)
  fatorReajuste    Decimal            @db.Decimal(5, 2) // percentual, ex: 10.50 = 10,5%
  salarioProposto  Decimal            @db.Decimal(10, 2)
  status           StatusMovimentacao @default(PENDENTE)
  observacoes      String?
  cicloAno         Int
  cicloMes         Int
  criadoEm         DateTime           @default(now())
  atualizadoEm     DateTime           @updatedAt
}

model Ferias {
  id             String       @id @default(cuid())
  colaboradorId  String
  colaborador    Colaborador  @relation(fields: [colaboradorId], references: [id])
  dataInicio     DateTime
  dataFim        DateTime
  status         StatusFerias @default(AGENDADA)
  observacoes    String?
  criadoEm       DateTime     @default(now())
  atualizadoEm   DateTime     @updatedAt
}
```

### 3.2 Relacionamentos

```
Projeto ──< Colaborador >── Colaborador (líder/subordinado — auto-referência)
Colaborador ──< Feedback
Colaborador ──< Ocorrencia
Colaborador ──< MovimentacaoSalarial
Colaborador ──< Ferias
```

---

## 4. Fases de Desenvolvimento

---

### FASE 1 — Fundação e Infraestrutura

**Objetivo:** Ter o ambiente Docker funcionando com Next.js, banco de dados configurado, autenticação e layout base da aplicação.

**Entregáveis:**
- `Dockerfile` e `docker-compose.yml` com serviços `app` e `db`
- `.env.example` com todas as variáveis necessárias
- Projeto Next.js 14+ inicializado com TypeScript e Tailwind CSS
- shadcn/ui configurado com tema base
- Prisma conectado ao PostgreSQL com schema inicial
- NextAuth.js configurado com credentials provider (usuário/senha mestre)
- Layout base: sidebar com links para todos os módulos + header
- Middleware de proteção de rotas (`src/middleware.ts`)
- Página de login (`/login`)
- Redirect automático: usuário não autenticado → `/login`

**Critérios de Aceite:**
- [ ] `docker compose up` sobe os dois containers sem erro
- [ ] Acessar `http://localhost:3000` redireciona para `/login`
- [ ] Login com credenciais do `.env` redireciona para o dashboard
- [ ] Login com credenciais erradas exibe mensagem de erro
- [ ] Sidebar está visível em todas as páginas autenticadas
- [ ] `npx prisma migrate dev` aplica as migrations com sucesso

---

### FASE 2 — Estrutura do Time

**Objetivo:** Gerenciar projetos e colaboradores, e visualizar a hierarquia do time em organograma.

**Entregáveis:**
- **Projetos:** listagem em tabela, formulário de criação/edição, confirmação de exclusão
- **Colaboradores:** listagem com filtros (projeto, senioridade, função), formulário completo com seleção de projeto e líder direto, toggle de ativo/inativo, confirmação de exclusão
- **Organograma:** árvore hierárquica gerada automaticamente a partir dos vínculos `liderId`, com nome, função e senioridade de cada nó

**Rotas de página:**
- `/projetos` — lista e gerenciamento de projetos
- `/colaboradores` — lista e gerenciamento de colaboradores
- `/organograma` — visualização em árvore

**Endpoints de API:**
- `GET/POST /api/projetos`
- `GET/PUT/DELETE /api/projetos/[id]`
- `GET/POST /api/colaboradores`
- `GET/PUT/DELETE /api/colaboradores/[id]`
- `GET /api/organograma` — retorna árvore hierárquica estruturada

**Critérios de Aceite:**
- [ ] É possível criar, editar e excluir projetos
- [ ] É possível criar, editar e inativar colaboradores
- [ ] Colaborador pode ter líder direto selecionado de outros colaboradores cadastrados
- [ ] Colaborador pode ser associado a um projeto cadastrado
- [ ] Organograma exibe todos os colaboradores ativos em estrutura de árvore
- [ ] Organograma atualiza ao adicionar/editar colaboradores

---

### FASE 3 — Gestão de Pessoas

**Objetivo:** Registrar e consultar feedbacks e ocorrências por colaborador, construindo um histórico de desenvolvimento individual.

**Entregáveis:**
- **Feedbacks:** listagem com filtro por colaborador e período, formulário de registro (data, tipo, fonte, descrição), edição e exclusão
- **Ocorrências:** listagem com filtro por colaborador, tipo (positiva/negativa) e período, formulário de registro (data, tipo, gravidade 1–5, descrição), edição e exclusão

**Rotas de página:**
- `/feedbacks` — lista e gerenciamento de feedbacks
- `/ocorrencias` — lista e gerenciamento de ocorrências

**Endpoints de API:**
- `GET/POST /api/feedbacks`
- `GET/PUT/DELETE /api/feedbacks/[id]`
- `GET/POST /api/ocorrencias`
- `GET/PUT/DELETE /api/ocorrencias/[id]`

**Critérios de Aceite:**
- [ ] É possível registrar feedback associado a um colaborador
- [ ] Feedbacks são filtráveis por colaborador, tipo e período
- [ ] É possível registrar ocorrência positiva e negativa com gravidade
- [ ] Ocorrências são filtráveis por colaborador, tipo e período
- [ ] Edição e exclusão funcionam para feedbacks e ocorrências

---

### FASE 4 — Gestão Financeira

**Objetivo:** Simular e documentar propostas de movimentação salarial e visualizar a planilha consolidada do time.

**Entregáveis:**
- **Movimentação Salarial:** formulário de criação com cálculo automático do salário proposto (`salarioProposto = salarioAtual * (1 + fatorReajuste/100)`), listagem com filtro por ciclo (ano/mês) e status, edição de status (pendente → aprovada → aplicada)
- **Planilha Salarial:** tabela consolidada de todos os colaboradores com salário atual, fator de reajuste, salário proposto e diferença (R$ e %), agrupável por projeto ou senioridade, com totalizadores, opção de impressão/PDF

**Rotas de página:**
- `/salario/movimentacoes` — gestão das propostas de movimentação
- `/salario/planilha` — visão consolidada da planilha salarial

**Endpoints de API:**
- `GET/POST /api/movimentacoes-salariais`
- `GET/PUT/DELETE /api/movimentacoes-salariais/[id]`
- `GET /api/salario/planilha` — retorna dados consolidados com totalizadores

**Critérios de Aceite:**
- [ ] Salário proposto é calculado automaticamente ao informar fator de reajuste
- [ ] É possível alterar o status da movimentação
- [ ] Planilha exibe todos os colaboradores com dados salariais e proposta
- [ ] Planilha exibe totalizador de custo atual e custo proposto
- [ ] Planilha é imprimível (layout otimizado para impressão/PDF)

---

### FASE 5 — Operações

**Objetivo:** Controlar o calendário de férias do time, identificando sobreposições e ausências simultâneas.

**Entregáveis:**
- Formulário de registro de férias (colaborador, data início, data fim, status, observações)
- Listagem em modo lista e modo calendário (visualização mensal)
- Indicador visual de sobreposição quando dois ou mais colaboradores têm férias no mesmo período
- Filtro por colaborador, status e período

**Rotas de página:**
- `/ferias` — listagem e calendário de férias

**Endpoints de API:**
- `GET/POST /api/ferias`
- `GET/PUT/DELETE /api/ferias/[id]`

**Critérios de Aceite:**
- [ ] É possível registrar, editar e excluir períodos de férias
- [ ] Visualização em lista e calendário funcionam
- [ ] Sobreposições de férias são sinalizadas visualmente
- [ ] Status das férias pode ser atualizado (agendada → em curso → concluída)

---

### FASE 6 — Inteligência

**Objetivo:** Consolidar métricas do time em um painel de indicadores com gráficos e cards de resumo.

**Entregáveis:**
- **Cards de resumo:** total de colaboradores ativos, distribuição por projeto, distribuição por senioridade, distribuição por função
- **Gráficos:** pizza ou donut de senioridade, barras de colaboradores por projeto, linha de feedbacks ao longo do tempo, barras de ocorrências positivas vs negativas
- **Alertas:** colaboradores com férias nos próximos 30 dias, colaboradores sem feedback nos últimos 90 dias
- **Filtro de período** para feedbacks e ocorrências no painel

**Rotas de página:**
- `/` ou `/indicadores` — página inicial/dashboard

**Endpoints de API:**
- `GET /api/indicadores` — retorna todos os dados consolidados do painel

**Critérios de Aceite:**
- [ ] Cards exibem totais corretos e atualizam em tempo real
- [ ] Gráficos renderizam com dados reais do banco
- [ ] Alertas de férias próximas listam colaboradores corretos
- [ ] Alertas de feedback ausente listam colaboradores sem feedback no período

---

## 5. Mapa de Rotas

### Páginas
| Rota | Módulo |
|------|--------|
| `/login` | Autenticação |
| `/` | Painel de Indicadores |
| `/projetos` | Projetos |
| `/colaboradores` | Colaboradores |
| `/organograma` | Organograma |
| `/feedbacks` | Feedbacks |
| `/ocorrencias` | Ocorrências |
| `/salario/movimentacoes` | Movimentação Salarial |
| `/salario/planilha` | Planilha Salarial |
| `/ferias` | Férias |

### API Endpoints
| Método | Endpoint | Ação |
|--------|----------|------|
| GET | `/api/projetos` | Listar projetos |
| POST | `/api/projetos` | Criar projeto |
| GET/PUT/DELETE | `/api/projetos/[id]` | Detalhar/editar/excluir |
| GET | `/api/colaboradores` | Listar colaboradores |
| POST | `/api/colaboradores` | Criar colaborador |
| GET/PUT/DELETE | `/api/colaboradores/[id]` | Detalhar/editar/excluir |
| GET | `/api/organograma` | Árvore hierárquica |
| GET | `/api/feedbacks` | Listar feedbacks |
| POST | `/api/feedbacks` | Registrar feedback |
| GET/PUT/DELETE | `/api/feedbacks/[id]` | Detalhar/editar/excluir |
| GET | `/api/ocorrencias` | Listar ocorrências |
| POST | `/api/ocorrencias` | Registrar ocorrência |
| GET/PUT/DELETE | `/api/ocorrencias/[id]` | Detalhar/editar/excluir |
| GET | `/api/movimentacoes-salariais` | Listar movimentações |
| POST | `/api/movimentacoes-salariais` | Criar movimentação |
| GET/PUT/DELETE | `/api/movimentacoes-salariais/[id]` | Detalhar/editar/excluir |
| GET | `/api/salario/planilha` | Dados consolidados da planilha |
| GET | `/api/ferias` | Listar férias |
| POST | `/api/ferias` | Registrar férias |
| GET/PUT/DELETE | `/api/ferias/[id]` | Detalhar/editar/excluir |
| GET | `/api/indicadores` | Dados do painel |

---

## 6. Requisitos Não-Funcionais

| Requisito | Descrição |
|-----------|-----------|
| **Segurança** | Dados acessíveis apenas após autenticação; credenciais nunca commitadas no repositório (apenas `.env.example`) |
| **Disponibilidade** | Aplicação local, sem SLA — disponível enquanto Docker estiver rodando |
| **Performance** | Respostas de API abaixo de 500ms para listas de até 200 registros |
| **Usabilidade** | Interface responsiva, navegável por sidebar, feedback visual em todas as ações (loading, sucesso, erro) |
| **Manutenibilidade** | Código em português, TypeScript estrito, sem lógica de negócio nos componentes de UI |
| **Portabilidade** | Toda a configuração via Docker Compose; reproduzível em qualquer máquina com Docker instalado |
