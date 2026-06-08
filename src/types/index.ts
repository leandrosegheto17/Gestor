export type Senioridade = "JUNIOR" | "PLENO" | "SENIOR" | "STAFF" | "PRINCIPAL"
export type TipoFeedback = "POSITIVO" | "CONSTRUTIVO" | "NEUTRO"
export type FonteFeedback = "GESTOR" | "LIDER_DIRETO" | "COLEGA" | "CLIENTE"
export type TipoOcorrencia = "POSITIVA" | "NEGATIVA"
export type StatusMovimentacao = "PENDENTE" | "APROVADA" | "APLICADA"
export type StatusFerias = "AGENDADA" | "EM_CURSO" | "CONCLUIDA"

export interface Projeto {
  id: string
  nome: string
  tecnologia: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface Colaborador {
  id: string
  nome: string
  usuario: string
  funcao: string
  senioridade: Senioridade
  ativo: boolean
  projetoId?: string | null
  projeto?: Projeto | null
  liderId?: string | null
  lider?: Pick<Colaborador, "id" | "nome"> | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface Feedback {
  id: string
  colaboradorId: string
  colaborador?: Pick<Colaborador, "id" | "nome">
  data: Date
  tipo: TipoFeedback
  descricao: string
  fonte: FonteFeedback
  criadoEm: Date
  atualizadoEm: Date
}

export interface Ocorrencia {
  id: string
  colaboradorId: string
  colaborador?: Pick<Colaborador, "id" | "nome">
  data: Date
  tipo: TipoOcorrencia
  descricao: string
  gravidade: number
  criadoEm: Date
  atualizadoEm: Date
}

export interface MovimentacaoSalarial {
  id: string
  colaboradorId: string
  colaborador?: Pick<Colaborador, "id" | "nome">
  salarioAtual: number
  fatorReajuste: number
  salarioProposto: number
  status: StatusMovimentacao
  observacoes?: string | null
  cicloAno: number
  cicloMes: number
  criadoEm: Date
  atualizadoEm: Date
}

export interface Ferias {
  id: string
  colaboradorId: string
  colaborador?: Pick<Colaborador, "id" | "nome">
  dataInicio: Date
  dataFim: Date
  status: StatusFerias
  observacoes?: string | null
  criadoEm: Date
  atualizadoEm: Date
}

export type RespostaApi<T> = {
  dados: T
}

export type ErroApi = {
  erro: string
}
