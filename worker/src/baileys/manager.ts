import { iniciarConexao, type ConexaoAtiva } from './connection'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      accessToken: async () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
  }
)

/** Map simples — no worker o processo é de longa vida, não precisa de globalThis */
const conexoes = new Map<string, ConexaoAtiva>()

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

/**
 * Restaura conexões que estavam ativas antes do worker reiniciar.
 * Busca no Supabase todas as conexões com status='conectado' e
 * tenta recriar os sockets (usando as sessões salvas em disco).
 */
export async function restaurarConexoes(): Promise<void> {
  const { data: ativas, error } = await supabase
    .from('conexoes_whatsapp')
    .select('id')
    .eq('status', 'conectado')

  if (error) {
    console.error('[manager] erro ao buscar conexões para restaurar', error)
    return
  }

  if (!ativas?.length) {
    console.log('[manager] nenhuma conexão para restaurar')
    return
  }

  console.log(`[manager] restaurando ${ativas.length} conexão(ões)...`)

  for (const { id } of ativas) {
    criarConexao(id).catch((e) =>
      console.error(`[manager] falha ao restaurar conexão ${id}`, e)
    )
  }
}
