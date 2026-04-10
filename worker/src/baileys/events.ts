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
          .select('id')
          .single()

        if (errContato || !contato) {
          console.error('[baileys] erro upsert contato', errContato)
          continue
        }

        // Criar lead no kanban apenas para mensagens novas (não histórico)
        if (type === 'notify' && !isGrupo) {
          try {
            const { data: contatoAtual } = await supabase
              .from('contatos_whatsapp')
              .select('id, cliente_id')
              .eq('id', contato.id)
              .single()

            if (contatoAtual?.cliente_id === null) {
              const { data: novoCliente } = await supabase
                .from('clientes')
                .insert({
                  organization_id: organizationId,
                  nome: msg.pushName ?? numero ?? 'Contato WhatsApp',
                  telefone: numero,
                  estagio_id: '8cf48bcc-d0fc-4af0-b220-1c2d6bb6ce36',
                  origem: 'whatsapp',
                })
                .select('id')
                .single()

              if (novoCliente) {
                await supabase
                  .from('contatos_whatsapp')
                  .update({ cliente_id: novoCliente.id })
                  .eq('id', contato.id)

                console.log('[events] novo lead criado:', novoCliente.id)
              }
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
