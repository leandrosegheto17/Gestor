import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor)
}

export function formatarData(data: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function calcularSalarioProposto(
  salarioAtual: number,
  fatorReajuste: number
): number {
  return salarioAtual * (1 + fatorReajuste / 100)
}
