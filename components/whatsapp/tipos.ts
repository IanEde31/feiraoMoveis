// Tipos compartilhados da feature WhatsApp

export type StatusConexao =
  | 'conectado'
  | 'desconectado'
  | 'aguardando_qr'
  | 'conectando'
  | 'erro'

export type Conexao = {
  id: string
  nome: string
  status: StatusConexao
  numero_telefone: string | null
  qr_code: string | null
}

export type Contato = {
  id: string
  conexao_id: string
  jid: string
  nome: string | null
  nome_push: string | null
  numero_telefone: string
  is_grupo: boolean
  avatar_url: string | null
}

export type Mensagem = {
  id: string
  conexao_id: string
  contato_id: string
  conteudo: string | null
  tipo: string
  enviado_por_nos: boolean
  timestamp_whatsapp: string
  status_entrega: string | null
}

export type UltimaMensagem = {
  contato_id: string | null
  conteudo: string | null
  enviado_por_nos: boolean | null
  timestamp_whatsapp: string | null
  tipo: string | null
  nao_lidas: number | null
}

// ─── Equipes / atribuição (ainda sem persistência — ver CLAUDE.md) ───────────

export type PresencaAgente = 'online' | 'ocupado' | 'ausente' | 'offline'

export type Agente = {
  id: string
  nome: string
  equipe: string
  presenca: PresencaAgente
  is_gerente?: boolean
}

export type PrioridadeConversa = 'urgente' | 'normal' | 'baixa'
export type StatusConversa = 'novo' | 'aguardando' | 'resolvido'

export type MetaConversa = {
  contato_id: string
  agente_id: string | null
  prioridade: PrioridadeConversa
  status: StatusConversa
  tags: string[]
  notas: NotaInterna[]
}

export type NotaInterna = {
  id: string
  autor: string
  texto: string
  criada_em: string
}

export type RespostaRapida = {
  id: string
  titulo: string
  texto: string
  conexao_id: string | null // null = todas
}

export type FiltroConversa = 'todas' | 'minhas' | 'sem_atribuicao' | 'urgente'
