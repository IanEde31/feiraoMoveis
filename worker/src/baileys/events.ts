import type { WASocket } from '@whiskeysockets/baileys'
import { createClient } from '@supabase/supabase-js'
import { responderComAgente } from '../agente'

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

/**
 * Registra os handlers de eventos do Baileys para persistir no Supabase.
 */
export function registrarEventos(conexaoId: string, organizationId: string, sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return

    for (const msg of messages) {
      try {
        const jid = msg.key.remoteJid
        console.log('[events] processando mensagem type:', type, 'fromMe:', !!msg.key.fromMe, 'isGrupo:', msg.key.remoteJid?.endsWith('@g.us'))
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
              organization_id: organizationId,
              jid,
              nome_push: msg.pushName ?? null,
              numero_telefone: numero,
              is_grupo: isGrupo,
            } as never,
            { onConflict: 'conexao_id,jid' }
          )
          .select('id, cliente_id')
          .single()

        if (errContato || !contato) {
          console.error('[baileys] erro upsert contato', errContato)
          continue
        }

        // Criar lead no kanban apenas para mensagens novas (não histórico)
        if (type === 'notify' && !isGrupo && contato.cliente_id === null) {
          try {
            // Upsert com ignoreDuplicates protege contra race condition:
            // se dois handlers concorrentes tentarem criar o mesmo lead,
            // o segundo recebe null e busca o cliente já criado pelo primeiro.
            const { data: clienteUpsert } = await supabase
              .from('clientes')
              .upsert(
                {
                  organization_id: organizationId,
                  nome: msg.pushName?.trim() || numero || 'Contato WhatsApp',
                  telefone: numero,
                  estagio_id: '8cf48bcc-d0fc-4af0-b220-1c2d6bb6ce36',
                  origem: 'whatsapp',
                },
                { onConflict: 'organization_id,telefone', ignoreDuplicates: true }
              )
              .select('id')
              .single()

            let clienteId = clienteUpsert?.id ?? null

            if (!clienteId) {
              const { data: existente } = await supabase
                .from('clientes')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('telefone', numero)
                .single()
              clienteId = existente?.id ?? null
            }

            if (clienteId) {
              await supabase
                .from('contatos_whatsapp')
                .update({ cliente_id: clienteId })
                .eq('id', contato.id)

              console.log('[events] novo lead criado:', clienteId)
            }
          } catch (eLead) {
            console.error('[events] erro ao criar lead', eLead)
          }
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
            organization_id: organizationId,
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
    for (const c of contacts) {
      if (!c.id) continue
      await supabase
        .from('contatos_whatsapp')
        .upsert(
          {
            conexao_id: conexaoId,
            organization_id: organizationId,
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
