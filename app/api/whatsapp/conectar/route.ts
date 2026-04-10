import { NextResponse } from 'next/server'
import { getOrgScopedClient } from '@/lib/supabase/with-org'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()

    const { conexao_id } = await req.json()
    if (!conexao_id) {
      return NextResponse.json({ error: 'conexao_id obrigatório' }, { status: 400 })
    }

    const { error: errInsert } = await supabase
      .from('comandos_whatsapp')
      .insert({
        organization_id: orgId,
        tipo: 'criar_conexao',
        payload: { conexao_id },
        status: 'pendente',
      })

    if (errInsert) throw new Error(errInsert.message)

    return NextResponse.json(
      { ok: true, message: 'Conexão sendo iniciada' },
      { status: 202 }
    )
  } catch (e: any) {
    if (e?.message === 'Não autenticado' || e?.message === 'Sem organização ativa') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[api/whatsapp/conectar]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
