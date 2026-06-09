// ─── Tabela de pontos por tipo e fonte de feedback ───────────────────────────

export const PONTOS_FEEDBACK: Record<string, Record<string, number>> = {
  POSITIVO: {
    CLIENTE:      10,
    COLEGA:        6,
    GESTOR:        4,
    LIDER_DIRETO:  3,
  },
  CONSTRUTIVO: {
    CLIENTE:     -10,
    COLEGA:       -3,
    GESTOR:       -8,
    LIDER_DIRETO: -5,
  },
  NEUTRO: {
    CLIENTE:      0,
    COLEGA:       0,
    GESTOR:       0,
    LIDER_DIRETO: 0,
  },
}

// Ocorrência: POSITIVA = +gravidade, NEGATIVA = -gravidade

export function calcularPontosFeedback(tipo: string, fonte: string): number {
  return PONTOS_FEEDBACK[tipo]?.[fonte] ?? 0
}

export function calcularPontosOcorrencia(tipo: string, gravidade: number): number {
  if (tipo === "POSITIVA") return gravidade
  if (tipo === "NEGATIVA") return -gravidade
  return 0
}

// ─── Classificação por faixa de pontuação ────────────────────────────────────

export type NivelDesempenho = "critico" | "atencao" | "regular" | "bom" | "destaque" | "referencia"

export interface FaixaDesempenho {
  nivel: NivelDesempenho
  rotulo: string
  cor: string          // Tailwind text color
  corFundo: string     // Tailwind bg color
  corBorda: string     // Tailwind border color
}

export function classificarPontuacao(pontuacao: number): FaixaDesempenho {
  if (pontuacao < 0)   return { nivel: "critico",   rotulo: "Crítico",          cor: "text-red-700",     corFundo: "bg-red-50",     corBorda: "border-red-200" }
  if (pontuacao < 20)  return { nivel: "atencao",   rotulo: "Atenção",          cor: "text-orange-700",  corFundo: "bg-orange-50",  corBorda: "border-orange-200" }
  if (pontuacao < 50)  return { nivel: "regular",   rotulo: "Regular",          cor: "text-yellow-700",  corFundo: "bg-yellow-50",  corBorda: "border-yellow-200" }
  if (pontuacao < 80)  return { nivel: "bom",       rotulo: "Bom desempenho",   cor: "text-green-700",   corFundo: "bg-green-50",   corBorda: "border-green-200" }
  if (pontuacao < 120) return { nivel: "destaque",  rotulo: "Destaque",         cor: "text-blue-700",    corFundo: "bg-blue-50",    corBorda: "border-blue-200" }
  return                      { nivel: "referencia",rotulo: "Referência",       cor: "text-purple-700",  corFundo: "bg-purple-50",  corBorda: "border-purple-200" }
}
