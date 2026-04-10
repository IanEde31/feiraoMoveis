import { NextResponse } from 'next/server'
import { obterConexao } from '@/lib/whatsapp/baileys/manager'
import { createServerClient } from '@/lib/supabase/server'
import { persistirMensagemEnviada } from '@/lib/whatsapp/persistir-mensagem-enviada'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { conexao_id, jid, texto } = await req.json()
    if (!conexao_id || !jid || !texto) {
      return NextResponse.json(
        { error: 'conexao_id, jid e texto são obrigatórios' },
        { status: 400 }
      )
    }
    const entry = obterConexao(conexao_id)
    if (!entry || entry.status !== 'conectado') {
      return NextResponse.json(
        { error: 'Conexão não está ativa. Conecte primeiro.' },
        { status: 400 }
      )
    }
    const resultado = await entry.sock.sendMessage(jid, { text: texto })

    // persiste imediatamente no banco (o evento messages.upsert também dispara,
    // mas queremos feedback rápido na UI)
    const supabase = createServerClient()
    const { data: contato } = await supabase
      .from('contatos_whatsapp')
      .upsert(
        {
          conexao_id,
          jid,
          numero_telefone: jid.split('@')[0],
          is_grupo: jid.endsWith('@g.us'),
        } as never,
        { onConflict: 'conexao_id,jid' }
      )
      .select('id')
      .single()

    if (contato && resultado?.key?.id) {
      await persistirMensagemEnviada({
        supabase,
        conexaoId: conexao_id,
        contatoId: contato.id,
        jid,
        meuJid: entry.sock.user?.id ?? '',
        messageId: resultado.key.id,
        conteudo: texto,
        timestampSegundos: resultado.messageTimestamp ?? null,
      })
    }

    return NextResponse.json({ ok: true, message_id: resultado?.key?.id ?? null })
  } catch (e: any) {
    console.error('[api/whatsapp/enviar]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
