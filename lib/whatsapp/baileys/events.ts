import type { WASocket } from 'baileys'
import { createServerClient } from '@/lib/supabase/server'
import { responderComAgente } from '@/lib/whatsapp/agente'

/**
 * Registra os handlers de eventos do Baileys para persistir no Supabase.
 */
export function registrarEventos(conexaoId: string, sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return
    const supabase = createServerClient()

    for (const msg of messages) {
      try {
        const jid = msg.key.remoteJid
        if (!jid || !msg.key.id) continue
        // ignora status broadcast
        if (jid === 'status@broadcast') continue

        const fromMe = !!msg.key.fromMe
        const numero = jid.split('@')[0]
        const isGrupo = jid.endsWith('@g.us')

        // upsert contato
        const { data: contato, error: errContato } = await supabase
          .from('contatos_whatsapp')
          .upsert(
            {
              conexao_id: conexaoId,
              jid,
              nome_push: msg.pushName ?? null,
              numero_telefone: numero,
              is_grupo: isGrupo,
            } as never,
            { onConflict: 'conexao_id,jid' }
          )
          .select('id')
          .single()

        if (errContato || !contato) {
          console.error('[baileys] erro upsert contato', errContato)
          continue
        }

        const m = msg.message
        const conteudo =
          m?.conversation ??
          m?.extendedTextMessage?.text ??
          m?.imageMessage?.caption ??
          m?.videoMessage?.caption ??
          m?.documentMessage?.caption ??
          null

        const tipo = m?.imageMessage
          ? 'imagem'
          : m?.videoMessage
          ? 'video'
          : m?.audioMessage
          ? 'audio'
          : m?.documentMessage
          ? 'documento'
          : m?.stickerMessage
          ? 'figurinha'
          : m?.locationMessage
          ? 'localizacao'
          : 'texto'

        const tsSec = Number(msg.messageTimestamp ?? 0)
        const tsIso = new Date(tsSec * 1000).toISOString()
        const meuJid = sock.user?.id ?? ''

        await supabase.from('mensagens_whatsapp').upsert(
          {
            conexao_id: conexaoId,
            contato_id: contato.id,
            message_id: msg.key.id,
            de: fromMe ? meuJid : jid,
            para: fromMe ? jid : meuJid,
            tipo,
            conteudo,
            enviado_por_nos: fromMe,
            status_entrega: 'entregue',
            timestamp_whatsapp: tsIso,
          } as never,
          { onConflict: 'conexao_id,message_id' }
        )

        // Agente IA — só responde mensagens de texto recebidas (não próprias, não grupo)
        if (!fromMe && tipo === 'texto' && conteudo && !isGrupo) {
          await responderComAgente({
            conexaoId,
            contatoId: contato.id,
            jid,
            texto: conteudo,
            sock,
          })
        }
      } catch (e) {
        console.error('[baileys] erro processando mensagem', e)
      }
    }
  })

  sock.ev.on('contacts.upsert', async (contacts) => {
    const supabase = createServerClient()
    for (const c of contacts) {
      if (!c.id) continue
      await supabase
        .from('contatos_whatsapp')
        .upsert(
          {
            conexao_id: conexaoId,
            jid: c.id,
            nome: c.name ?? c.notify ?? null,
            nome_push: c.notify ?? null,
            numero_telefone: c.id.split('@')[0],
            is_grupo: c.id.endsWith('@g.us'),
          } as never,
          { onConflict: 'conexao_id,jid' }
        )
    }
  })
}
