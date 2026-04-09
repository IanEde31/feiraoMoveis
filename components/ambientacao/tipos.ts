import type { Produto } from '@/components/produtos/tipos'

export type { Produto }

export type EstadoGeracao = 'idle' | 'enviando' | 'gerando' | 'pronto' | 'erro'

export interface AmbienteImagem {
  arquivo: File
  url: string
  largura?: number
  altura?: number
}

export interface ResultadoAmbientacao {
  id: string
  url: string
  geradaEm: string
  jaAdicionada: boolean
}

export interface ClienteResumo {
  id: string
  nome: string
  telefone?: string | null
}

export interface ItemGaleria {
  id: string
  cliente_id: string
  miniatura_url: string
  resultado_url: string
  produtos_ids: string[]
  produtos_nomes: string[]
  criada_em: string
}
