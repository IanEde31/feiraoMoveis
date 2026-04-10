import { NextResponse } from 'next/server'
import { obterConexao } from '@/lib/whatsapp/baileys/manager'
import { getOrgScopedClient } from '@/lib/supabase/with-org'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()

    const { searchParams } = new URL(req.url)
    const conexaoId = searchParams.get('conexao_id')
    if (!conexaoId) {
      return NextResponse.json({ error: 'conexao_id obrigatório' }, { status: 400 })
    }
    const entry = obterConexao(conexaoId)
    if (entry) {
      return NextResponse.json({
        status: entry.status,
        qr: entry.qr ?? null,
        em_memoria: true,
      })
    }
    // fallback: estado persistido no banco
    const { data } = await supabase
      .from('conexoes_whatsapp')
      .select('status, qr_code')
      .eq('id', conexaoId)
      .eq('organization_id', orgId)
      .single()
    return NextResponse.json({
      status: data?.status ?? 'desconectado',
      qr: data?.qr_code ?? null,
      em_memoria: false,
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
