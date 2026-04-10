import type { SupabaseClient } from '@supabase/supabase-js'

type Args = {
  supabase: SupabaseClient
  conexaoId: string
  contatoId: string
  jid: string
  meuJid: string
  messageId: string
  conteudo: string
  /**
   * Timestamp da mensagem em segundos (epoch) — vindo do Baileys via
   * `resultado.messageTimestamp`. Se omitido, usa o relógio local, mas
   * isso pode causar ordem errada (clock skew em relação ao servidor WA).
   */
  timestampSegundos?: number | Long | null
}

// Tipo simplificado pra aceitar `Long` do baileys sem importar a lib inteira
type Long = { toNumber(): number }

/**
 * Persiste no Supabase uma mensagem que acabou de ser enviada via Baileys.
 * Idempotente: usa onConflict (conexao_id, message_id) para evitar duplicatas
 * caso o handler messages.upsert também dispare para a mesma mensagem.
 */
export async function persistirMensagemEnviada({
  supabase,
  conexaoId,
  contatoId,
  jid,
  meuJid,
  messageId,
  conteudo,
  timestampSegundos,
}: Args) {
  // Prefere o timestamp atribuído pelo servidor do WhatsApp (mesma fonte
  // usada para mensagens recebidas em events.ts) — evita clock skew local.
  let timestampIso: string
  if (timestampSegundos != null) {
    const segs =
      typeof timestampSegundos === 'number'
        ? timestampSegundos
        : timestampSegundos.toNumber()
    timestampIso = new Date(segs * 1000).toISOString()
  } else {
    timestampIso = new Date().toISOString()
  }

  await supabase.from('mensagens_whatsapp').upsert(
    {
      conexao_id: conexaoId,
      contato_id: contatoId,
      message_id: messageId,
      de: meuJid,
      para: jid,
      tipo: 'texto',
      conteudo,
      enviado_por_nos: true,
      status_entrega: 'enviado',
      timestamp_whatsapp: timestampIso,
    } as never,
    { onConflict: 'conexao_id,message_id' }
  )
}
