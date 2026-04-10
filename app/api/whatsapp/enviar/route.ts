import { NextResponse } from 'next/server'
import { getOrgScopedClient } from '@/lib/supabase/with-org'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()

    const { conexao_id, jid, texto, contato_id } = await req.json()
    if (!conexao_id || !jid || !texto) {
      return NextResponse.json(
        { error: 'conexao_id, jid e texto são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: cmd, error: errInsert } = await supabase
      .from('comandos_whatsapp')
      .insert({
        organization_id: orgId,
        tipo: 'enviar_mensagem',
        payload: { conexao_id, jid, texto, contato_id: contato_id ?? null },
        status: 'pendente',
      })
      .select('id')
      .single()

    if (errInsert || !cmd) {
      throw new Error(errInsert?.message ?? 'Erro ao criar comando')
    }

    // polling até 15s
    const limite = Date.now() + 15_000
    while (Date.now() < limite) {
      await new Promise((r) => setTimeout(r, 500))
      const { data } = await supabase
        .from('comandos_whatsapp')
        .select('status, resultado, erro')
        .eq('id', cmd.id)
        .single()
      if (data?.status === 'concluido') return NextResponse.json({ ok: true })
      if (data?.status === 'erro')
        return NextResponse.json({ error: data.erro }, { status: 500 })
    }

    return NextResponse.json({ ok: true, pendente: true }, { status: 202 })
  } catch (e: any) {
    if (e?.message === 'Não autenticado' || e?.message === 'Sem organização ativa') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[api/whatsapp/enviar]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
