export type Origem = 'whatsapp' | 'indicacao' | 'loja_fisica' | 'site' | 'instagram' | 'outro'

export interface EstagioKanban {
  id: string
  nome: string
  cor: string
  ordem: number
  eh_final: boolean
  tipo_final?: 'ganho' | 'perdido' | null
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  estagio_id: string
  origem?: Origem
  tags: string[]
  valor_estimado?: number
  created_at: string
}

export interface FiltrosAtivos {
  busca: string
  origens: Origem[]
  tags: string[]
}
