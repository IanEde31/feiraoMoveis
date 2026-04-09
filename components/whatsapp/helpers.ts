import type { Contato, StatusConexao, PresencaAgente } from './tipos'

const CORES_AVATAR = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-indigo-500',
]

export function corAvatar(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return CORES_AVATAR[Math.abs(hash) % CORES_AVATAR.length]
}

export function nomeExibicao(c: Contato): string {
  return c.nome ?? c.nome_push ?? c.numero_telefone
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).slice(0, 2)
  return partes.map((p) => p.charAt(0).toUpperCase()).join('') || '?'
}

export function formatarHorario(iso: string): string {
  const d = new Date(iso)
  const diffDias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diffDias === 0)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDias === 1) return 'Ontem'
  if (diffDias < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatarData(iso: string): string {
  const d = new Date(iso)
  const diffDias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diffDias === 0) return 'Hoje'
  if (diffDias === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function mesmoDia(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export const STATUS_LABEL: Record<StatusConexao, string> = {
  conectado: 'Conectado',
  aguardando_qr: 'Aguardando QR',
  conectando: 'Conectando…',
  desconectado: 'Desconectado',
  erro: 'Erro',
}

export const PRESENCA_COR: Record<PresencaAgente, string> = {
  online: 'bg-emerald-500',
  ocupado: 'bg-amber-500',
  ausente: 'bg-slate-400',
  offline: 'bg-slate-300',
}

export const PRESENCA_LABEL: Record<PresencaAgente, string> = {
  online: 'Online',
  ocupado: 'Ocupado',
  ausente: 'Ausente',
  offline: 'Offline',
}

// Minutos sem resposta para considerar "aguardando"
export const LIMITE_AGUARDANDO_MIN = 10
