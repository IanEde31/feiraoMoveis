import { iniciarConexao, type ConexaoAtiva } from './connection'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Gerencia todas as conexões Baileys ativas em memória.
 * Usa globalThis para sobreviver ao HMR do Next.js em dev.
 */
const g = globalThis as unknown as {
  __baileysConexoes?: Map<string, ConexaoAtiva>
}
if (!g.__baileysConexoes) g.__baileysConexoes = new Map<string, ConexaoAtiva>()
const conexoes = g.__baileysConexoes

/**
 * Cria e inicia um socket Baileys para a conexão indicada.
 * Se já existir uma conexão ativa (status='conectado'), retorna ela.
 * Qualquer outro estado força a criação de um novo socket.
 */
export async function criarConexao(conexaoId: string): Promise<ConexaoAtiva> {
  const existente = conexoes.get(conexaoId)
  if (existente?.status === 'conectado') {
    return existente
  }

  // Garante que nenhum entry antigo polua o map enquanto o novo socket inicia
  conexoes.delete(conexaoId)

  // Busca organization_id da conexão para propagar nos inserts de eventos
  const supabase = createServerClient()
  const { data: conexaoDB, error: errConexao } = await supabase
    .from('conexoes_whatsapp')
    .select('organization_id')
    .eq('id', conexaoId)
    .single()

  if (errConexao || !conexaoDB?.organization_id) {
    console.error(`[manager] organization_id não encontrado para conexão ${conexaoId}`, errConexao)
    return { sock: null as never, status: 'desconectado' as const }
  }

  const organizationId = conexaoDB.organization_id

  const entry = await iniciarConexao(
    conexaoId,
    organizationId,
    // onUpdate: chamado pelo socket sempre que o status muda
    (e) => {
      conexoes.set(conexaoId, e)
    },
    // onDisconnect: chamado quando o socket fecha
    (code, loggedOut) => {
      conexoes.delete(conexaoId)
      if (!loggedOut) {
        // 515 (restart required) ou qualquer fechamento não-logout:
        // recriar o socket usando a sessão já salva no disco
        console.log(`[manager] reagendando reconexão (code=${code}) para ${conexaoId}`)
        setTimeout(() => {
          criarConexao(conexaoId).catch((e) =>
            console.error('[manager] erro ao reconectar', e)
          )
        }, 1500)
      }
    }
  )

  conexoes.set(conexaoId, entry)
  return entry
}

export function obterConexao(conexaoId: string): ConexaoAtiva | undefined {
  return conexoes.get(conexaoId)
}

export async function removerConexao(conexaoId: string, encerrarSocket = true) {
  const e = conexoes.get(conexaoId)
  if (!e) return
  if (encerrarSocket) {
    try {
      e.sock.end(undefined)
    } catch {}
  }
  conexoes.delete(conexaoId)
}

export function listarConexoesAtivas(): string[] {
  return Array.from(conexoes.keys())
}
