import { NextResponse } from 'next/server'
import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { criarConexao } from '@/lib/whatsapp/baileys/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    await getOrgScopedClient()

    const { conexao_id } = await req.json()
    if (!conexao_id) {
      return NextResponse.json({ error: 'conexao_id obrigatório' }, { status: 400 })
    }
    const entry = await criarConexao(conexao_id)
    return NextResponse.json({
      status: entry.status,
      qr: entry.qr ?? null,
    })
  } catch (e: any) {
    if (e?.message === 'Não autenticado' || e?.message === 'Sem organização ativa') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[api/whatsapp/conectar]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
