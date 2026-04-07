import type { Tables } from '@/lib/supabase/types'

export type Produto = Tables<'produtos'> & {
  categorias_produto?: { id: string; nome: string } | null
}

export type CategoriaProduto = Tables<'categorias_produto'>

export type NivelEstoque = 'ok' | 'baixo' | 'critico'

export function nivelEstoque(atual: number, minimo: number): NivelEstoque {
  if (atual === 0) return 'critico'
  if (minimo > 0 && atual <= minimo) return 'baixo'
  return 'ok'
}

export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(valor)
}

export function calcularMargem(venda: number, custo: number): string | null {
  if (!custo || custo <= 0) return null
  const margem = ((venda - custo) / custo) * 100
  return `${margem.toFixed(1)}%`
}
